# routes/audio_upload.py
from __future__ import annotations
from services.token_service import get_current_user
import os
import aiofiles
from fastapi import (
    APIRouter,
    Depends,
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
router = APIRouter(dependencies=[Depends(get_current_user)])

UPLOAD_DIR = "recordings"         # local temp folder
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload-audio/", status_code=status.HTTP_201_CREATED)
async def upload_audio(
    file: UploadFile = File(...),
    patient_email: str = Form(...),
    therapist_email: str = Form(...),
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
    
    # ---------------------------------------------------------------------- #
    # 0.  Input validation
    # ---------------------------------------------------------------------- #
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="File has no filename")
    
    if file.size == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    
    # Check if file is too large (e.g., 100MB limit)
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
    if file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Maximum size allowed: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    if not patient_email or not therapist_email or not session_date:
        raise HTTPException(
            status_code=400, 
            detail="Missing required fields: patient_email, therapist_email, or session_date"
        )
    
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
        try:
            audio_url = upload_to_azure(local_path, file.filename, folder="recordings")
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload audio file to Azure Blob Storage: {str(exc)}"
            ) from exc

        # ------------------------------------------------------------------
        # 3.  Build SAS URL and transcribe
        # ------------------------------------------------------------------
        try:
            sas_url = create_sas_url(f"recordings/{file.filename}", minutes=120)
            print(f"SAS URL = {sas_url}")
            _, transcript_url = transcribe_dialog(sas_url, locale="he-IL")
            print(transcript_url)
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to transcribe audio file: {str(exc)}"
            ) from exc

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error during upload processing: {str(exc)}"
        ) from exc

    finally:
        # always remove the temp file
        if os.path.exists(local_path):
            os.remove(local_path)

    # ---------------------------------------------------------------------- #
    # 4.  Store metadata in SQL
    # ---------------------------------------------------------------------- #
    try:
        print(f"patient_email: {patient_email}")
        print(f"therapist_email: {therapist_email}")
        save_session_to_db(
            patient_email,          # placeholder, not yet used in the helper
            therapist_email,        # placeholder, not yet used
            session_date,
            audio_url,             # BlobURL column
            transcript_url,        # Transcript column
            notes,                 # SessionNotes column
        )
    except Exception as exc:
        # Log the error but don't fail the entire upload since files are already uploaded
        print(f"Warning: Failed to save session to database: {exc}")
        # You might want to decide whether to fail here or just log the warning
        # For now, we'll continue and return success since the files were uploaded
        pass

    # ---------------------------------------------------------------------- #
    # 5.  Respond to the client
    # ---------------------------------------------------------------------- #
    return {
        "status": "uploaded",
        "audio_url": audio_url,
        "transcript_url": transcript_url,
    }
