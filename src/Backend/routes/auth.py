from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models.TherapistLogin import TherapistLogin
from models.Therapist import Therapist
from schemas.TherapistLogin import TherapistLoginRequest, TherapistLoginResponse
from schemas.TherapistRegister import TherapistRegisterRequest
from src.Backend.database import SessionLocal
import hashlib
import jwt

from config import SECRET_KEY  # Make sure to set this in your config
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from services.token_service import verify_token
from datetime import datetime, timedelta

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter()
print("✅ auth.py loaded")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 📥 התחברות
@router.post("/login", response_model=TherapistLoginResponse)
def login(credentials: TherapistLoginRequest, db: Session = Depends(get_db)):
    print("🔐 login called with:", credentials.email)

    therapist = db.query(TherapistLogin).filter(TherapistLogin.email == credentials.email).first()

    if not therapist:
        print("❌ Therapist not found")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email")

    hashed_input = hashlib.sha256(credentials.password.encode()).hexdigest()
    if hashed_input != therapist.hashed_password:
        print("❌ Invalid password")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")


    # Generate JWT token
    token_data = {
    "sub": therapist.id,
    "exp": datetime.utcnow() + timedelta(minutes=30)  # תוקף של 30 דקות
    }
    access_token = jwt.encode(token_data, SECRET_KEY, algorithm="HS256")
    

    return TherapistLoginResponse(
        therapist_id=therapist.id,
        access_token=access_token,
        token_type="bearer"
    )



@router.get("/verify")
def verify_token_route(token: str = Depends(oauth2_scheme)):
    print("Received token:", token)
    verify_token(token)
    return {"valid": True}

@router.post("/register")
def register(data: TherapistRegisterRequest, db: Session = Depends(get_db)):
    print("📥 Register attempt:", data.email)

    # בדיקה אם מייל כבר רשום
    existing = db.query(TherapistLogin).filter(TherapistLogin.email == data.email).first()
    if existing:
        print("❌ Email already registered")
        raise HTTPException(status_code=400, detail="Email already registered")

    # יצירת רשומת מטפל (שמות השדות מותאמים למודל שלך)
    new_therapist = Therapist(
        FullName=data.full_name,
        Specialization=data.specialization,
        ContactInfo=data.contact_info
    )
    db.add(new_therapist)
    db.commit()
    db.refresh(new_therapist)
    print("👤 Therapist created with ID:", new_therapist.TherapistID)

    # יצירת hash לסיסמה
    hashed_password = hashlib.sha256(data.password.encode()).hexdigest()

    # שמירה בטבלת התחברות (בהנחה שיש שדה therapist_id)
    login_record = TherapistLogin(id=new_therapist.TherapistID,
        email=data.email,
        hashed_password=hashed_password)
    
    db.add(login_record)
    db.commit()
    print("✅ Registration completed")

    return {"message": "Registration successful"}

