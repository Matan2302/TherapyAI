# routes/transcription.py
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl

from services.azure_transcription import transcribe_dialog

router = APIRouter(prefix="/transcription", tags=["Transcription"])


class TranscriptionIn(BaseModel):
    sas_url: HttpUrl
    locale: str | None = "he-IL"


class TranscriptionOut(BaseModel):
    lines: list[str]
    transcript_url: HttpUrl                       # NEW


@router.post("/", response_model=TranscriptionOut)
async def transcribe_audio(body: TranscriptionIn):
    """
    Receive a SAS URL, run Azure Speech, store the .txt blob, and
    return both the dialog lines and the blob URL.
    """
    try:
        # transcribe_dialog now gives (lines, txt_url)
        lines, txt_url = transcribe_dialog(str(body.sas_url), body.locale)

        # optional debug print
        for l in lines:
            print(l)

        return {"lines": lines, "transcript_url": txt_url}

    except Exception as exc:
        # always convert to str so the detail is JSON-serialisable
        raise HTTPException(status_code=500, detail=str(exc)) from exc
