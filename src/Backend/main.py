from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import route files (we'll create these later)
from routes import audio_upload
from routes import auth
from routes import patients

app = FastAPI()

# Allow frontend (React) to talk to backend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # change if deployed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/ping")
async def ping():
    return {"message": "pong"}
# Register your API routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(audio_upload.router, prefix="/audio", tags=["Audio Upload"])
app.include_router(patients.router, prefix="/patients", tags=["Patients"])
