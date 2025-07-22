# routes/audio_upload_async.py
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
from services.blob_service import upload_to_azure
from services.processing_service import processing_service

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
    NEW ASYNCHRONOUS APPROACH:
    1. Validate input and save file locally
    2. Upload WAV to Azure Blob (fast - 2-3 seconds)
    3. Create processing job for background transcription/sentiment
    4. Return immediately with job ID for status tracking
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
    # 1.  Save file locally temporarily
    # ------------------------------------------------------------------ #
    if not file.filename.lower().endswith(".wav"):
        file.filename = file.filename + ".wav"
    local_path = os.path.join(UPLOAD_DIR, file.filename)
    
    async with aiofiles.open(local_path, "wb") as out_fh:
        await out_fh.write(await file.read())

    try:
        # ------------------------------------------------------------------
        # 2.  Upload to Azure Blob (fast step - 2-3 seconds)
        # ------------------------------------------------------------------
        try:
            audio_url = upload_to_azure(local_path, file.filename, folder="recordings")
            print(f"✅ Audio uploaded successfully: {audio_url}")
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload audio file to Azure Blob Storage: {str(exc)}"
            ) from exc

        # ------------------------------------------------------------------
        # 3.  Create background processing job
        # ------------------------------------------------------------------
        try:
            job_id = processing_service.create_job(
                patient_email=patient_email,
                therapist_email=therapist_email,
                session_date=session_date,
                session_notes=notes,
                audio_url=audio_url
            )
            print(f"✅ Processing job created: {job_id}")
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create processing job: {str(exc)}"
            ) from exc

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error during upload: {str(exc)}"
        ) from exc
    finally:
        # Always remove the temp file
        if os.path.exists(local_path):
            os.remove(local_path)

    # ---------------------------------------------------------------------- #
    # 4.  Return immediate success with job tracking info
    # ---------------------------------------------------------------------- #
    return {
        "status": "uploaded",
        "message": "Audio uploaded successfully! Processing in background...",
        "job_id": job_id,
        "audio_url": audio_url,
        "processing_status": "started"
    }


@router.get("/upload-status/{job_id}", status_code=status.HTTP_200_OK)
async def get_upload_status(job_id: str):
    """
    Get the current status of a background processing job
    """
    try:
        status_info = processing_service.get_job_status(job_id)
        if not status_info:
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )
        
        return status_info
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get job status: {str(exc)}"
        ) from exc


@router.post("/retry-processing/{job_id}", status_code=status.HTTP_200_OK)
async def retry_processing(job_id: str):
    """
    Retry a failed processing job
    """
    try:
        success = processing_service.retry_job(job_id)
        if not success:
            raise HTTPException(
                status_code=400,
                detail="Job not found, already completed, or retry limit exceeded"
            )
        
        return {
            "status": "retry_started",
            "message": "Processing job has been restarted",
            "job_id": job_id
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retry job: {str(exc)}"
        ) from exc
