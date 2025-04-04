from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
# Import route files (we'll create these later)
from routes import audio_upload
from routes import auth

app = FastAPI()

# Allow frontend (React) to talk to backend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # change if deployed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register your API routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(audio_upload.router, prefix="/audio", tags=["Audio Upload"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)