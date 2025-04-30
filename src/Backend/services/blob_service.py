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

import pymssql
from azure.storage.blob import (
    BlobServiceClient,
    generate_blob_sas,
    BlobSasPermissions,
)

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
    or getattr(config, "AZURE_BLOB_CONTAINER_NAME", "recordings")
)

if not AZURE_CONN_STR:
    raise RuntimeError(
        "Azure Blob connection string missing. "
        "Set AZURE_BLOB_CONN_STRING in .env or config.py"
    )

# Azure SQL (TherapyDB)
DB_SERVER = os.getenv("DB_SERVER") or getattr(config, "DB_SERVER", None)
DB_USER = os.getenv("DB_USER") or getattr(config, "DB_USER", None)
DB_PASSWORD = os.getenv("DB_PASSWORD") or getattr(config, "DB_PASSWORD", None)
DB_DATABASE = os.getenv("DB_DATABASE") or getattr(config, "DB_DATABASE", None)

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
        blob_name=blob_name,                       # <── no 'recordings/' prefix
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

# ---------------------------------------------------------------------------
# ❻  Insert one row into dbo.Sessions  (pymssql)
# ---------------------------------------------------------------------------
def save_session_to_db(
    patient_name: str,
    therapist_name: str,
    session_date: str,   # "YYYY-MM-DD"
    blob_url: str,       # WAV URL
    transcript_url: str, # TXT URL
    notes: str = "",
) -> None:
    
    try:
        sess_date_obj = datetime.strptime(session_date, "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValueError(
        "session_date must be in YYYY-MM-DD format"
    ) from exc
        
    db_cfg = {
        "server":   DB_SERVER,
        "user":     DB_USER,
        "password": DB_PASSWORD,
        "database": DB_DATABASE,
    }
    missing = [k for k, v in db_cfg.items() if not v]
    if missing:
        raise RuntimeError(
            f"Missing DB settings: {', '.join(missing)}. "
            "Check your .env or config.py."
        )

    conn = pymssql.connect(**db_cfg)
    cur = conn.cursor()

    # Replace `1,1` with real look-ups if you later add Patients / Therapists tables
    sql = """
        INSERT INTO dbo.Sessions
            (PatientID, TherapistID, SessionDate,
             SessionNotes, BlobURL, Transcript, Timestamp)
        VALUES
            (%s, %s, %s, %s, %s, %s, %s);
    """
    cur.execute(
        sql,
        (
            patient_name,                       # PatientID placeholder
            therapist_name,                       # TherapistID placeholder
            session_date,
            notes,
            blob_url,
            transcript_url,
            datetime.utcnow(),
        ),
    )
    conn.commit()
    conn.close()
