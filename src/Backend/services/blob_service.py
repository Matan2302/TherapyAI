# services/blob_service.py
"""
Blob helpers  +  short-lived SAS  +  dbo.Sessions insert
-------------------------------------------------------

* Reads Azure / SQL settings first from env-vars, otherwise from `config.py`
  (which already calls dotenv).
* Uploads any local file to the `recordings` container.
* Generates read-only SAS URLs for Azure Speech.
* Saves the transcript lines as <wav>.txt in the same container.
* Inserts one row into dbo.Sessions with BlobURL, Transcript & Notes
  using raw pymssql.
"""

from __future__ import annotations
import os
import tempfile
from datetime import datetime, timedelta
from typing import List
import requests
import pymssql
from azure.storage.blob import (
    BlobServiceClient,
    generate_blob_sas,
    BlobSasPermissions,
)
from urllib.parse import urlparse


# ---------------------------------------------------------------------------
# ❶  Load settings  (env-vars first, then config.py fallback)
# ---------------------------------------------------------------------------
try:
    import config  # your module that load_dotenv() at import-time
except ModuleNotFoundError:
    config = None  # allows the file to load even in unit tests

# Azure Blob
AZURE_CONN_STR = (
    os.getenv("AZURE_BLOB_CONN_STRING")
    or getattr(config, "AZURE_BLOB_CONN_STRING", None)
)
CONTAINER = (
    os.getenv("AZURE_BLOB_CONTAINER_NAME")
    or getattr(config, "AZURE_BLOB_CONTAINER_NAME", "main")
)

if not AZURE_CONN_STR:
    raise RuntimeError(
        "Azure Blob connection string missing. "
        "Set AZURE_BLOB_CONN_STRING in .env or config.py"
    )

# ---------------------------------------------------------------------------
# ❷  Blob client
# ---------------------------------------------------------------------------
_blob_client = BlobServiceClient.from_connection_string(AZURE_CONN_STR)
_container = _blob_client.get_container_client(CONTAINER)

def upload_to_azure(local_path: str, blob_name: str, folder: str | None = None) -> str:
    """
    Upload `local_path` to the current container.
      • If folder=None  →  blob name is   <blob_name>
      • If folder='xyz' →  blob name is   xyz/<blob_name>
    Returns the HTTPS URL (no SAS).
    """
    if folder:
        blob_name = f"{folder.rstrip('/')}/{blob_name}"

    with open(local_path, "rb") as fh:
        _container.upload_blob(
            name=blob_name,
            data=fh,
            overwrite=True,
            content_type="audio/wav" if blob_name.lower().endswith(".wav") else "text/plain",
        )
    return f"{_container.url}/{blob_name}"


# 2️⃣  SAS builder for the WAV we just uploaded  (root level, no folder prefix)
def create_sas_url(blob_name: str, minutes: int = 120) -> str:
    sas = generate_blob_sas(
        account_name=_blob_client.account_name,
        container_name=_container.container_name,
        blob_name=blob_name,         
        account_key=_blob_client.credential.account_key,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.utcnow() + timedelta(minutes=minutes),
    )
    return f"{_container.url}/{blob_name}?{sas}"


# 3️⃣  Store transcript under  transcriptions/<wav>.txt
def upload_transcript_to_azure(lines: List[str], wav_filename: str) -> str:
    txt_name = f"{os.path.splitext(wav_filename)[0]}.txt"

    with tempfile.NamedTemporaryFile("w+", delete=False, encoding="utf-8") as tmp:
        tmp.write("\n".join(lines))
        tmp_path = tmp.name

    url = upload_to_azure(tmp_path, txt_name, folder="transcriptions")
    os.remove(tmp_path)
    return url

def download_blob_to_tempfile(blob_url: str) -> str:
    """
    Downloads a blob from Azure Blob Storage using a full HTTPS blob URL.
    Returns path to a local temp file.
    """
    # Extract path after container name
    parsed = urlparse(blob_url)
    path = parsed.path.lstrip("/")  # e.g. "main/transcriptions/file.txt"

    # Remove the container name from path: e.g., "main/transcriptions/..." -> "transcriptions/..."
    container_prefix = CONTAINER.rstrip("/") + "/"
    if not path.startswith(container_prefix):
        raise ValueError("Blob URL does not match expected container.")
    blob_path = path[len(container_prefix):]  # e.g. "transcriptions/file.txt"

    blob_client = _container.get_blob_client(blob_path)

    with tempfile.NamedTemporaryFile("w+", delete=False, suffix=".txt", encoding="utf-8") as tmp:
        download_stream = blob_client.download_blob()
        tmp.write(download_stream.readall().decode("utf-8"))
        return tmp.name


    