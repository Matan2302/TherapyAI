from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.TherapistLogin import TherapistLogin
from schemas.TherapistLogin import TherapistLoginRequest, TherapistLoginResponse
from database import SessionLocal
import hashlib
import jwt  # pip install PyJWT
from config import SECRET_KEY  # Make sure to set this in your config
router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/login", response_model=TherapistLoginResponse)
def login(credentials: TherapistLoginRequest, db: Session = Depends(get_db)):
    # Look up therapist by email
    therapist = db.query(TherapistLogin).filter(TherapistLogin.email == credentials.email).first()

    if not therapist:
        raise HTTPException(status_code=401, detail="Invalid email")

    # Validate password (for now using sha256)
    hashed_input = hashlib.sha256(credentials.password.encode()).hexdigest()
    if hashed_input != therapist.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid  password")

    # Generate JWT token
    token_data = {"sub": therapist.id}
    access_token = jwt.encode(token_data, SECRET_KEY, algorithm="HS256")

    return TherapistLoginResponse(
        therapist_id=therapist.id,
        access_token=access_token,
        token_type="bearer"
    )
