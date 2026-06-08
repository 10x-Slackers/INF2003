import argparse
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from functools import wraps
import time
from typing import Any, Sequence

import pandas as pd
import requests

from scripts.dataset_config import DATASETS
from scripts.dataset_config.base import DatasetConfig

BASE_URL = "https://api-open.data.gov.sg/v1/public/api/datasets"
METADATA_BASE_URL = "https://api-production.data.gov.sg/v2/public/api/datasets"
TIMEOUT_SECONDS = 30
POLL_INTERVAL_SECONDS = 5
MAX_RETRIES = 3


class DataGovDatasetClient:
    def __init__(
        self,
        api_key: str | None = None,
    ) -> None:
        self.session = requests.Session()
        if api_key:
            self.session.headers.update({"x-api-key": api_key})

    def fetch_dataset(self, config: DatasetConfig) -> pd.DataFrame:
        metadata = self._fetch_dataset_metadata(config)
        dataset_format = metadata.get("format", "").upper()

        if dataset_format == "CSV":
            self._initiate_download(config)

        download_url = self._poll_download_url(config)
        return self._read_dataset_url(
            download_url,
            dataset_format=dataset_format,
        )

    @staticmethod
    def _download_payload(config: DatasetConfig) -> dict[str, Any]:
        payload: dict[str, Any] = {}

        if config.column_names:
            payload["columnNames"] = config.column_names

        if config.filters:
            payload["filters"] = config.filters

        return payload

    def _request_json(
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

    def _fetch_dataset_metadata(self, config: DatasetConfig) -> dict[str, Any]:
        url = f"{METADATA_BASE_URL}/{config.dataset_id}/metadata"
        body = self._request_json(url)
        return body.get("data", {})

    def _initiate_download(self, config: DatasetConfig) -> None:
        url = f"{BASE_URL}/{config.dataset_id}/initiate-download"
        payload = self._download_payload(config)
        self._request_json(url, json_payload=payload or None)

    def _poll_download_url(self, config: DatasetConfig) -> str:
        url = f"{BASE_URL}/{config.dataset_id}/poll-download"
        payload = self._download_payload(config)

        for poll_number in range(MAX_RETRIES):
            print(f"Polling for download URL for dataset '{config.key}'")
            body = self._request_json(url, json_payload=payload or None)
            download_url = body.get("data", {}).get("url")
            if download_url:
                return download_url

            if poll_number < MAX_RETRIES - 1:
                time.sleep(POLL_INTERVAL_SECONDS)

        raise TimeoutError(f"Download URL not available after {MAX_RETRIES} polls")

    def _read_dataset_url(self, url: str, *, dataset_format: str) -> pd.DataFrame:
        normalised_format = dataset_format.upper()

        if normalised_format == "CSV":
            return pd.read_csv(url)

        response = self.session.get(url, timeout=TIMEOUT_SECONDS)
        response.raise_for_status()
        payload = response.json()

        if normalised_format in {"GEOJSON", "JSON"}:
            return self._normalise_geojson(payload)

        raise ValueError(f"Unsupported dataset format: {dataset_format}")

    def _normalise_geojson(self, payload: dict[str, Any]) -> pd.DataFrame:
        features = payload.get("features")
        if isinstance(features, list):
            return pd.json_normalize(features)

        return pd.json_normalize(payload)

    @staticmethod
    def _parse_retry_after(value: str | None, default: float) -> float:
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
    client = DataGovDatasetClient(
        api_key=args.api_key,
    )
    dataframes: dict[str, pd.DataFrame] = {}

    for config in DATASETS:
        dataframe = client.fetch_dataset(config)
        dataframes[config.key] = dataframe


if __name__ == "__main__":
    main()
