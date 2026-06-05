from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Callable

import pandas as pd
import requests
from dotenv import load_dotenv

try:
    from scripts.dataset_config import DATASETS
    from scripts.dataset_config.base import DatasetConfig
except ModuleNotFoundError:
    from dataset_config import DATASETS
    from dataset_config.base import DatasetConfig

load_dotenv()  # Load environment variables from .env file

BASE_URL = "https://api-open.data.gov.sg/v1/public/api/datasets"
METADATA_BASE_URL = "https://api-production.data.gov.sg/v2/public/api/datasets"
MAX_REQUESTS_PER_MINUTE = 5
REQUEST_INTERVAL_SECONDS = 60 / MAX_REQUESTS_PER_MINUTE
DEFAULT_TIMEOUT_SECONDS = 30
DEFAULT_MAX_POLLS = 10
DEFAULT_POLL_INTERVAL_SECONDS = 5
MAX_RETRIES = 3


class DatasetFetchError(RuntimeError):
    """Raised when a dataset cannot be fetched from data.gov.sg."""


class DatasetPollTimeoutError(DatasetFetchError):
    """Raised when a dataset download URL is not ready within the poll limit."""


def _normalise_geojson(payload: dict[str, Any]) -> pd.DataFrame:
    features = payload.get("features")
    if isinstance(features, list):
        return pd.json_normalize(features)

    return pd.json_normalize(payload)


@dataclass
class DataGovDatasetClient:
    session: requests.Session = field(default_factory=requests.Session)
    base_url: str = BASE_URL
    metadata_base_url: str = METADATA_BASE_URL
    timeout: int = DEFAULT_TIMEOUT_SECONDS
    max_retries: int = MAX_RETRIES
    max_polls: int = DEFAULT_MAX_POLLS
    poll_interval_seconds: int = DEFAULT_POLL_INTERVAL_SECONDS
    request_interval_seconds: float = REQUEST_INTERVAL_SECONDS
    sleep: Callable[[float], None] = time.sleep

    @staticmethod
    def download_payload(config: DatasetConfig) -> dict[str, Any]:
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
        for attempt in range(self.max_retries + 1):
            response = self.session.get(
                url,
                json=json_payload,
                timeout=self.timeout,
            )

            if response.status_code != 429:
                response.raise_for_status()
                body = response.json()
                if body.get("errorMsg"):
                    raise DatasetFetchError(body["errorMsg"])
                return body

            if attempt == self.max_retries:
                response.raise_for_status()

            retry_after = response.headers.get("Retry-After")
            retry_delay = (
                float(retry_after) if retry_after else self.request_interval_seconds
            )
            self.sleep(retry_delay)

        raise DatasetFetchError(f"Unable to fetch {url}")

    def fetch_dataset_metadata(self, config: DatasetConfig) -> dict[str, Any]:
        url = f"{self.metadata_base_url}/{config.dataset_id}/metadata"
        body = self.request_json(url)
        return body.get("data", {})

    def initiate_download(self, config: DatasetConfig) -> None:
        url = f"{self.base_url}/{config.dataset_id}/initiate-download"
        payload = self.download_payload(config)
        self.request_json(url, json_payload=payload or None)

    def poll_download_url(self, config: DatasetConfig) -> str:
        url = f"{self.base_url}/{config.dataset_id}/poll-download"
        payload = self.download_payload(config)

        for poll_number in range(self.max_polls):
            body = self.request_json(url, json_payload=payload or None)
            download_url = body.get("data", {}).get("url")
            if download_url:
                return download_url

            if poll_number < self.max_polls - 1:
                self.sleep(self.poll_interval_seconds)

        raise DatasetPollTimeoutError(
            f"Download for dataset {config.dataset_id} "
            f"was not ready after {self.max_polls} polls."
        )

    def read_dataset_url(self, url: str, *, dataset_format: str) -> pd.DataFrame:
        normalised_format = dataset_format.upper()

        if normalised_format == "CSV":
            return pd.read_csv(url)

        response = self.session.get(url, timeout=self.timeout)
        response.raise_for_status()
        payload = response.json()

        if normalised_format in {"GEOJSON", "JSON"}:
            return _normalise_geojson(payload)

        raise DatasetFetchError(f"Unsupported dataset format: {dataset_format}")

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


def main() -> None:
    datasets = DataGovDatasetClient().fetch_all_datasets()
    for key, dataframe in datasets.items():
        columns = ", ".join(dataframe.columns)
        print(f"{key}: {len(dataframe)} rows, {len(dataframe.columns)} columns")
        print(f"  columns: {columns}")


if __name__ == "__main__":
    main()
