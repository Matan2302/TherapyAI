# routes/sentiment_analysis.py

from fastapi import APIRouter, HTTPException, status
from services.blob_service import upload_to_azure
from services.azure_sentiment import analyze_sentiment_from_blob
from services.sql_service import update_session_analysis, get_transcript_url_by_SID

import tempfile
import os
import json

router = APIRouter(tags=["Sentiment"])


@router.post("/analyze-sentiment/", status_code=status.HTTP_200_OK)
async def analyze_sentiment(session_id: int):
    """
    1. Get transcript URL from DB
    2. Analyze it using real Azure + Gemini logic
    3. Upload JSON to Azure
    4. Update DB with analysis blob URL
    5. Return analysis + blob URL
    """
    tmp_path = None  # ← define this up front to avoid UnboundLocalError

    try:
        transcript_url = get_transcript_url_by_SID(session_id)
        if not transcript_url:
            raise ValueError("No transcript URL found for that session.")

        sentiment_data = analyze_sentiment_from_blob(transcript_url)

        tmp_filename = f"{session_id}_analysis.json"
        with tempfile.NamedTemporaryFile("w+", delete=False, suffix=".json", encoding="utf-8") as tmp:
            json.dump(sentiment_data, tmp, indent=2, ensure_ascii=False)
            tmp_path = tmp.name

        analysis_blob_url = upload_to_azure(tmp_path, tmp_filename, folder="analysis")

        update_session_analysis(session_id=session_id, analysis_blob_url=analysis_blob_url)

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {exc}") from exc

    finally:
        if tmp_path and os.path.exists(tmp_path):  # ← safe cleanup
            os.remove(tmp_path)

    return {
        "status": "analyzed",
        "sentiment": sentiment_data,
        "analysis_url": analysis_blob_url,
    }

