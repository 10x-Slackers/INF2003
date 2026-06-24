import os
import time
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any

import pandas as pd
import requests

from extract.config import DatasetConfig

BASE_URL = "https://api-open.data.gov.sg/v1/public/api/datasets"
METADATA_BASE_URL = "https://api-production.data.gov.sg/v2/public/api/datasets"
TIMEOUT = 30
POLL_INTERVAL = 5
MAX_RETRIES = 3


def _parse_retry_after(value: str | None, default: float) -> float:
    """Parse a Retry-After header (seconds or HTTP-date) into a delay."""
    if not value:
        return default
    try:
        return max(0.0, float(value))
    except ValueError:
        pass
    try:
        retry_time = parsedate_to_datetime(value)
        if retry_time.tzinfo is None:
            retry_time = retry_time.replace(tzinfo=timezone.utc)
        return max(0.0, (retry_time - datetime.now(timezone.utc)).total_seconds())
    except (TypeError, ValueError, OverflowError):
        return default


class DataGovDatasetClient:
    """Client that downloads datasets from data.gov.sg and returns them as dataframes."""

    def __init__(self, api_key: str | None = None) -> None:
        self.session = requests.Session()
        # Fall back to the environment variable if no API key is provided
        key = api_key or os.environ.get("DATAGOV_API_KEY")
        if key:
            self.session.headers.update({"x-api-key": key})

    def fetch_dataset(self, config: DatasetConfig) -> pd.DataFrame:
        """Download a dataset and return it as a dataframe."""
        metadata = self._fetch_dataset_metadata(config)
        dataset_format = metadata.get("format", "").upper()
        if dataset_format == "CSV":
            self._initiate_download(config)

        download_url = self._poll_download_url(config)
        return self._read_dataset_url(download_url, dataset_format=dataset_format)

    def _fetch_dataset_metadata(self, config: DatasetConfig) -> dict[str, Any]:
        """Get dataset metadata from the API."""
        url = f"{METADATA_BASE_URL}/{config.dataset_id}/metadata"
        body = self._request_json(url)
        return body.get("data", {})

    def _initiate_download(self, config: DatasetConfig) -> None:
        """Tell the API to prepare the dataset for download."""
        url = f"{BASE_URL}/{config.dataset_id}/initiate-download"
        payload = self._build_payload(config)
        self._request_json(url, json_payload=payload or None)

    def _poll_download_url(self, config: DatasetConfig) -> str:
        """Poll the API until a download URL is available."""
        url = f"{BASE_URL}/{config.dataset_id}/poll-download"
        payload = self._build_payload(config)

        for _ in range(MAX_RETRIES):
            body = self._request_json(url, json_payload=payload or None)
            download_url = body.get("data", {}).get("url")
            if download_url:
                return download_url
            time.sleep(POLL_INTERVAL)

        raise RuntimeError(
            f"Download URL not ready for '{config.key}' after {MAX_RETRIES} polls"
        )

    def _read_dataset_url(self, url: str, *, dataset_format: str) -> pd.DataFrame:
        """Fetch the data at url and return a dataframe."""
        fmt = dataset_format.upper()

        if fmt == "CSV":
            return pd.read_csv(url)

        response = self.session.get(url, timeout=TIMEOUT)
        response.raise_for_status()
        payload = response.json()

        if fmt in {"GEOJSON", "JSON"}:
            return self._normalise_geojson(payload)

        raise ValueError(f"Unsupported dataset format: {dataset_format}")

    @staticmethod
    def _build_payload(config: DatasetConfig) -> dict[str, Any]:
        """Build the JSON payload for initiate/poll requests."""
        payload: dict[str, Any] = {}
        if config.column_names:
            payload["columnNames"] = config.column_names
        if config.filters:
            payload["filters"] = config.filters
        return payload

    @staticmethod
    def _normalise_geojson(payload: dict[str, Any]) -> pd.DataFrame:
        """Normalise a GeoJSON payload into a flat DataFrame."""
        features = payload.get("features")
        if isinstance(features, list):
            return pd.json_normalize(features)
        return pd.json_normalize(payload)

    def _request_json(
        self,
        url: str,
        *,
        json_payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """GET url and return the parsed JSON body, retrying on 429."""
        for attempt in range(MAX_RETRIES + 1):
            response = self.session.get(url, json=json_payload, timeout=TIMEOUT)
            if response.status_code != 429:
                response.raise_for_status()
                return response.json()

            if attempt == MAX_RETRIES:
                response.raise_for_status()

            retry_after = response.headers.get("Retry-After")
            time.sleep(_parse_retry_after(retry_after, POLL_INTERVAL))

        raise
