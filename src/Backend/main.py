from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.Backend.routes import audio_upload
from src.Backend.routes import auth
from src.Backend.routes import patient_routes


# Import route files (we'll create these later)
from src.Backend.routes import audio_upload
from src.Backend.routes import auth

from src.Backend.routes import patients
from src.Backend.routes import patient_routes


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

app.include_router(patients.router, prefix="/patientsdb", tags=["Patients"])

app.include_router(patient_routes.router, prefix="/patients", tags=["Patients"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.Backend.main:app", host="0.0.0.0", port=8000, reload=False)


