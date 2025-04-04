from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models.TherapistLogin import TherapistLogin
from models.Therapist import Therapist
from schemas.TherapistLogin import TherapistLoginRequest, TherapistLoginResponse
from schemas.TherapistRegister import TherapistRegisterRequest
from database import SessionLocal
import hashlib
import jwt
from config import SECRET_KEY


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

    try:
        token_data = {"sub": str(therapist.id)}
        access_token = jwt.encode(token_data, SECRET_KEY, algorithm="HS256")
        print("✅ Token created")
    except Exception as e:
        print("🔥 Token generation error:", str(e))
        raise HTTPException(status_code=500, detail="Token generation failed")

    return TherapistLoginResponse(
        therapist_id=therapist.id,
        access_token=access_token,
        token_type="bearer"
    )

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
