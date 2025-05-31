# routes/sentiment_analysis.py

from fastapi import APIRouter, HTTPException, status
from schemas.patient_data import SentimentAnalysisResponse, SentimentDetails  # <-- import your schemas
from services.blob_service import upload_to_azure
from services.azure_sentiment import analyze_sentiment_from_blob, get_analysis_from_blob
from services.sql_service import update_session_analysis, get_transcript_url_by_SID
from pydantic import BaseModel

import tempfile
import os
import json

router = APIRouter(tags=["Sentiment"])

class AnalyzeRequest(BaseModel):
    session_id: int

@router.post(
    "/analyze-sentiment/",
    status_code=status.HTTP_200_OK,
    response_model=SentimentAnalysisResponse
)
async def analyze_sentiment(request: AnalyzeRequest):
    session_id = request.session_id

    tmp_path = None

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
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    sentiment_details = SentimentDetails(**sentiment_data)

    return SentimentAnalysisResponse(
        status="analyzed",
        sentiment=sentiment_details,
        analysis_url=analysis_blob_url,
    )


#def function to bring from blob storage the analysis file
@router.get("/get-analysis-from-url/", response_model=SentimentAnalysisResponse)
def get_analysis_from_url(url: str):
    """
    Fetch the sentiment analysis from Azure Blob Storage using the session ID.
    """
    try:
        print(f"Fetching analysis from URL: {url}")
        # Assuming you have a function to fetch the analysis from Azure Blob Storage
        analysis_data = get_analysis_from_blob(url)

        if not analysis_data:
            raise HTTPException(status_code=404, detail="Analysis data not found.")

        sentiment_details = SentimentDetails(
            total_positive=analysis_data["total_positive"],
            total_negative=analysis_data["total_negative"],
            top_5_positive=analysis_data["top_5_positive"],
            top_5_negative=analysis_data["top_5_negative"],
            summary=analysis_data["summary"],
        )
        print(f"Fetched analysis details: {sentiment_details}")

        return SentimentAnalysisResponse(
            status="fetched",
            sentiment=sentiment_details,
            analysis_url=url,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analysis: {exc}") from exc
    
