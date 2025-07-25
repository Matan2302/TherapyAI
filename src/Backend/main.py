from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import audio_upload
from routes import audio_upload_async
from routes import auth
from routes import patient_routes
from routes import patients
from routes import transcription
from routes import sentiment_analysis
import uvicorn


app = FastAPI()

# Allow frontend (React) to talk to backend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:80",
        "http://127.0.0.1",
        "http://127.0.0.1:80",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/ping")
async def ping():
    return {"message": "pong"}
# Register your API routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(auth.admin_router, prefix="/admin", tags=["Admin Panel"])
app.include_router(audio_upload.router, prefix="/audio", tags=["Audio Upload"])
app.include_router(audio_upload_async.router, prefix="/audio-async", tags=["Audio Upload Async"])
app.include_router(patients.router, prefix="/patientsdb", tags=["Patients"])
app.include_router(patient_routes.router, prefix="/patients", tags=["Patients"])
app.include_router(transcription.router, prefix="/transcription", tags=["Transcription"])
app.include_router(sentiment_analysis.router, prefix="/sentiment", tags=["Sentiment"])


if __name__ == "__main__":
    uvicorn.run("src.Backend.main:app", host="0.0.0.0", port=8000, reload=False)


