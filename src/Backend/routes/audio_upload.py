from fastapi import APIRouter, File, UploadFile, Form
import os
import aiofiles
from services.blob_service import save_session_to_db
from services.blob_service import upload_to_azure

router = APIRouter()

UPLOAD_DIR = "recordings"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload-audio/")
async def upload_audio(
    file: UploadFile = File(...),
    patient_name: str = Form(...),
    therapist_name: str = Form(...),
    session_date: str = Form(...),
    notes: str = Form(...),
    

):
    # Save file locally
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    async with aiofiles.open(file_path, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)

    # Upload to Azure Blob
    audio_url = upload_to_azure(file_path, file.filename)

    # Clean up
    os.remove(file_path)

    # Save metadata to DB
    save_session_to_db(patient_name, therapist_name, session_date, audio_url,notes)

    return {"status": "uploaded", "url": audio_url}
