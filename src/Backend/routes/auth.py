from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models.TherapistLogin import TherapistLogin
from models.Therapist import Therapist
from models.Admin import Admin  # ✅ ייבוא מודל אדמין
from schemas.TherapistLogin import TherapistLoginRequest, TherapistLoginResponse
from schemas.TherapistRegister import TherapistRegisterRequest
from database import SessionLocal
import hashlib
import jwt

from config import SECRET_KEY
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
    print(db)
    print("🔐 login called with:", credentials.email)

    # 🔒 בדיקה אם המשתמש הוא אדמין (לפי Adminusername)
    admin = db.query(Admin).filter(Admin.Adminusername == credentials.email).first()
    if admin:
        if credentials.password == admin.AdminPassword:  # אין צורך ב-hash
            print("👑 Admin login successful")
            token_data = {
                "sub": "admin",
                "role": "admin",
                "exp": datetime.utcnow() + timedelta(minutes=60)
            }
            access_token = jwt.encode(token_data, SECRET_KEY, algorithm="HS256")
            return TherapistLoginResponse(
                therapist_id=-1,
                access_token=access_token,
                full_name="Admin",
                token_type="bearer"
            )
        else:
            raise HTTPException(status_code=401, detail="Invalid admin password")

    # 🔄 אם לא אדמין, בדיקה רגילה של מטפל
    therapist = db.query(TherapistLogin).filter(TherapistLogin.email == credentials.email).first()

    if not therapist:
        raise HTTPException(status_code=401, detail="Invalid email")

    hashed_input = hashlib.sha256(credentials.password.encode()).hexdigest()
    if hashed_input != therapist.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid password")

    if not therapist.is_approved:
        raise HTTPException(status_code=403, detail="Account pending admin approval")

    # Generate JWT token
    token_data = {
        "sub": therapist.id,
        "exp": datetime.utcnow() + timedelta(minutes=30)
    }
    access_token = jwt.encode(token_data, SECRET_KEY, algorithm="HS256")

    therapist_details = db.query(Therapist).filter(Therapist.TherapistID == therapist.id).first()
    if not therapist_details:
        raise HTTPException(status_code=404, detail="Therapist details not found")

    return TherapistLoginResponse(
        therapist_id=therapist.id,
        access_token=access_token,
        full_name=therapist_details.FullName,
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
    login_record = TherapistLogin(
        id=new_therapist.TherapistID,
        email=data.email,
        hashed_password=hashed_password,
        is_approved=False  # ✅ מוודא שמטפל חדש לא יאושר אוטומטית
        )
    
    db.add(login_record)
    db.commit()
    print("✅ Registration completed")

    return {"message": "Registration successful"}




@router.get("/admin/pending-therapists")
def get_pending_therapists(db: Session = Depends(get_db)):
    results = (
        db.query(Therapist, TherapistLogin)
        .join(TherapistLogin, Therapist.TherapistID == TherapistLogin.id)
        .filter(TherapistLogin.is_approved == False)
        .all()
    )
    
    return [
        {
            "id": login.id,
            "full_name": therapist.FullName,
            "email": login.email,
            "specialization": therapist.Specialization
        }
        for therapist, login in results
    ]




@router.post("/admin/approve/{therapist_id}")
def approve_therapist(therapist_id: int, db: Session = Depends(get_db)):
    therapist = db.query(TherapistLogin).filter(TherapistLogin.id == therapist_id).first()
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist not found")
    
    therapist.is_approved = True
    db.commit()
    return {"message": "Therapist approved successfully"}


@router.delete("/admin/reject/{therapist_id}")
def reject_therapist(therapist_id: int, db: Session = Depends(get_db)):
    login = db.query(TherapistLogin).filter(TherapistLogin.id == therapist_id).first()
    therapist = db.query(Therapist).filter(Therapist.TherapistID == therapist_id).first()

    if login:
        db.delete(login)
    if therapist:
        db.delete(therapist)

    db.commit()
    return {"message": "Therapist rejected and deleted"}

