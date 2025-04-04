from fastapi import APIRouter, HTTPException, Body
from services.speech_service import transcribe_and_upload
import traceback

router = APIRouter()

@router.post("/transcribe-audio/")
async def transcribe_audio(
    sas_url: str = Body(..., embed=True),
    base_filename: str = Body(..., embed=True)
):
    try:
        transcription_url = transcribe_and_upload(sas_url, base_filename)
        return {
            "status": "success",
            "transcription_url": transcription_url
        }
    except Exception as e:
        print("[ERROR] Transcription failed:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
