# routes/audio_upload.py
from __future__ import annotations

import os
import aiofiles
from fastapi import (
    APIRouter,
    File,
    Form,
    UploadFile,
    HTTPException,
    status,
)

# ─── project helpers ─────────────────────────────────────────────────────────
from services.blob_service import (
    upload_to_azure,     # push .wav / .txt to Blob Storage
    create_sas_url     # build read-only SAS for Azure Speech  # insert a row into dbo.Sessions
)
from services.sql_service import save_session_to_db
from services.azure_transcription import transcribe_dialog

# ─── router setup ───────────────────────────────────────────────────────────
router = APIRouter( tags=["Audio"])

UPLOAD_DIR = "recordings"         # local temp folder
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload-audio/", status_code=status.HTTP_201_CREATED)
async def upload_audio(
    file: UploadFile = File(...),
    patient_name: str = Form(...),
    therapist_name: str = Form(...),
    session_date: str = Form(...),   # YYYY-MM-DD from the form
    notes: str = Form(""),           # optional
):
    """
    1.  Save the uploaded WAV locally
    2.  Push WAV to Azure Blob  ➞  get `audio_url`
    3.  Generate SAS and run Azure Speech batch transcription
        ➞  get `transcript_url`
    4.  Delete the local WAV
    5.  Persist metadata in dbo.Sessions
    6.  Return URLs to the front-end
    """
    # ------------------------------------------------------------------ #
    # 1.  Persist locally just long enough to upload
    # ------------------------------------------------------------------ #
    if not file.filename.lower().endswith(".wav"):
        file.filename = file.filename + ".wav"
    local_path = os.path.join(UPLOAD_DIR, file.filename)
    async with aiofiles.open(local_path, "wb") as out_fh:
        await out_fh.write(await file.read())

    try:
        # ------------------------------------------------------------------
        # 2.  WAV ➝ Azure Blob
        # ------------------------------------------------------------------
        audio_url = upload_to_azure(local_path, file.filename, folder="recordings")


        # ------------------------------------------------------------------
        # 3.  Build SAS URL and transcribe
        # ------------------------------------------------------------------
        sas_url = create_sas_url(f"recordings/{file.filename}", minutes=120)
        print(f"SAS URL = {sas_url}")
        _, transcript_url = transcribe_dialog(sas_url, locale="he-IL")
        print(transcript_url)

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Upload or transcription failed: {exc}"
        ) from exc

    finally:
        # always remove the temp file
        if os.path.exists(local_path):
            os.remove(local_path)

    # ---------------------------------------------------------------------- #
    # 4.  Store metadata in SQL
    # ---------------------------------------------------------------------- #
    # NOTE: current helper still inserts PatientID / TherapistID = 1, 1.
    save_session_to_db(
        patient_name,          # placeholder, not yet used in the helper
        therapist_name,        # placeholder, not yet used
        session_date,
        audio_url,             # BlobURL column
        transcript_url,        # Transcript column
        notes,                 # SessionNotes column
    )

    # ---------------------------------------------------------------------- #
    # 5.  Respond to the client
    # ---------------------------------------------------------------------- #
    return {
        "status": "uploaded",
        "audio_url": audio_url,
        "transcript_url": transcript_url,
    }
