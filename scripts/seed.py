import argparse
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import time
from typing import Any, Sequence

import pandas as pd
import requests

from scripts.dataset_config import DATASETS
from scripts.dataset_config.base import DatasetConfig

BASE_URL = "https://api-open.data.gov.sg/v1/public/api/datasets"
METADATA_BASE_URL = "https://api-production.data.gov.sg/v2/public/api/datasets"
TIMEOUT_SECONDS = 30
MAX_POLLS = 10
POLL_INTERVAL_SECONDS = 5
MAX_RETRIES = 3


class DataGovDatasetClient:
    def __init__(self, api_key: str | None = None) -> None:
        self.session = requests.Session()
        if api_key:
            self.session.headers.update({"x-api-key": api_key})

    def download_payload(self, config: DatasetConfig) -> dict[str, Any]:
        payload: dict[str, Any] = {}

        if config.column_names:
            payload["columnNames"] = config.column_names

        if config.filters:
            payload["filters"] = config.filters

        return payload

    def request_json(
        self,
        url: str,
        *,
        json_payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        for attempt in range(MAX_RETRIES + 1):
            response = self.session.get(
                url,
                json=json_payload,
                timeout=TIMEOUT_SECONDS,
            )

            # rate limit exceeded
            if response.status_code != 429:
                response.raise_for_status()
                body = response.json()
                if body.get("errorMsg"):
                    print(f"API error for {url}: {body['errorMsg']}")
                    return {}
                return body

            if attempt == MAX_RETRIES:
                response.raise_for_status()

            retry_after = response.headers.get("Retry-After")

            retry_delay = self._parse_retry_after(retry_after, POLL_INTERVAL_SECONDS)
            time.sleep(retry_delay)

        return {}

    def fetch_dataset_metadata(self, config: DatasetConfig) -> dict[str, Any]:
        url = f"{METADATA_BASE_URL}/{config.dataset_id}/metadata"
        body = self.request_json(url)
        return body.get("data", {})

    def initiate_download(self, config: DatasetConfig) -> None:
        url = f"{BASE_URL}/{config.dataset_id}/initiate-download"
        payload = self.download_payload(config)
        self.request_json(url, json_payload=payload or None)

    def poll_download_url(self, config: DatasetConfig) -> str:
        url = f"{BASE_URL}/{config.dataset_id}/poll-download"
        payload = self.download_payload(config)

        for poll_number in range(MAX_POLLS):
            body = self.request_json(url, json_payload=payload or None)
            download_url = body.get("data", {}).get("url")
            if download_url:
                return download_url

            if poll_number < MAX_POLLS - 1:
                time.sleep(POLL_INTERVAL_SECONDS)

        raise TimeoutError(f"Download URL not available after {MAX_POLLS} polls")

    def read_dataset_url(self, url: str, *, dataset_format: str) -> pd.DataFrame:
        normalised_format = dataset_format.upper()

        if normalised_format == "CSV":
            return pd.read_csv(url)

        response = self.session.get(url, timeout=TIMEOUT_SECONDS)
        response.raise_for_status()
        payload = response.json()

        if normalised_format in {"GEOJSON", "JSON"}:
            return self._normalise_geojson(payload)

        raise ValueError(f"Unsupported dataset format: {dataset_format}")

    def fetch_dataset(self, config: DatasetConfig) -> pd.DataFrame:
        metadata = self.fetch_dataset_metadata(config)
        dataset_format = metadata.get("format", "").upper()

        if dataset_format == "CSV":
            self.initiate_download(config)

        download_url = self.poll_download_url(config)
        return self.read_dataset_url(
            download_url,
            dataset_format=dataset_format,
        )

    def fetch_all_datasets(
        self,
        datasets: tuple[DatasetConfig, ...] = DATASETS,
    ) -> dict[str, pd.DataFrame]:
        return {config.key: self.fetch_dataset(config) for config in datasets}

    def _normalise_geojson(self, payload: dict[str, Any]) -> pd.DataFrame:
        features = payload.get("features")
        if isinstance(features, list):
            return pd.json_normalize(features)

        return pd.json_normalize(payload)

    def _parse_retry_after(self, value: str | None, default: float) -> float:
        if not value:
            return default

        # Case 1: Retry-After is seconds
        try:
            return max(0.0, float(value))
        except ValueError:
            pass

        # Case 2: Retry-After is HTTP-date
        try:
            retry_time = parsedate_to_datetime(value)

            if retry_time.tzinfo is None:
                retry_time = retry_time.replace(tzinfo=timezone.utc)

            now = datetime.now(timezone.utc)
            return max(0.0, (retry_time - now).total_seconds())

        except (TypeError, ValueError, OverflowError):
            return default


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch configured data.gov.sg datasets into pandas DataFrames."
    )
    parser.add_argument("--api-key", help="data.gov.sg API key.")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> None:
    args = parse_args(argv)
    datasets = DataGovDatasetClient(api_key=args.api_key).fetch_all_datasets()
    for key, dataframe in datasets.items():
        columns = ", ".join(dataframe.columns)
        print(f"{key}: {len(dataframe)} rows, {len(dataframe.columns)} columns")
        print(f"  columns: {columns}")


if __name__ == "__main__":
    main()
