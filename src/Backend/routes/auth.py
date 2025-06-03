from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.TherapistLogin import TherapistLogin
from models.Therapist import Therapist
from models.Admin import Admin
from schemas.TherapistLogin import TherapistLoginRequest, TherapistLoginResponse
from schemas.TherapistRegister import TherapistRegisterRequest
from database import get_db
import hashlib
from services.token_service import create_access_token, get_current_admin
import re

router = APIRouter()
admin_router = APIRouter(dependencies=[Depends(get_current_admin)])

# 📥 Register therapist
@router.post("/register")
def register(data: TherapistRegisterRequest, db: Session = Depends(get_db)):
    print("📥 Register attempt:", data.email)

    existing = db.query(TherapistLogin).filter(TherapistLogin.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if not is_password_strong(data.password):
        raise HTTPException(status_code=400, detail="Password is not strong enough. It must be at least 7 characters long and include both uppercase and lowercase letters.")

    new_therapist = Therapist(
        FullName=data.full_name,
        Specialization=data.specialization,
        ContactInfo=data.contact_info
    )
    db.add(new_therapist)
    db.commit()
    db.refresh(new_therapist)

    hashed_password = hashlib.sha256(data.password.encode()).hexdigest()

    login_record = TherapistLogin(
        id=new_therapist.TherapistID,
        email=data.email,
        hashed_password=hashed_password,
        is_approved=False
    )
    db.add(login_record)
    db.commit()

    return {"message": "Registration successful"}

def is_password_strong(password: str) -> bool:
    if len(password) < 7:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    return True

@router.post("/login", response_model=TherapistLoginResponse)
def login(credentials: TherapistLoginRequest, db: Session = Depends(get_db)):
    print("🔐 Login called with:", credentials.email)

    # Admin check
    admin = db.query(Admin).filter(Admin.Adminusername == credentials.email).first()
    if admin and credentials.password == admin.AdminPassword:
        token = create_access_token(user_id="admin", role="admin")
        return TherapistLoginResponse(
            therapist_id=-1,
            access_token=token,
            full_name="Admin",
            token_type="bearer"
        )

    # Therapist check
    therapist = db.query(TherapistLogin).filter(TherapistLogin.email == credentials.email).first()
    if not therapist:
        raise HTTPException(status_code=401, detail="Invalid email")

    hashed_input = hashlib.sha256(credentials.password.encode()).hexdigest()
    if hashed_input != therapist.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid password")

    if not therapist.is_approved:
        raise HTTPException(status_code=403, detail="Account pending admin approval")

    token = create_access_token(user_id=therapist.id, role="therapist")

    therapist_details = db.query(Therapist).filter(Therapist.TherapistID == therapist.id).first()
    return TherapistLoginResponse(
        therapist_id=therapist.id,
        access_token=token,
        full_name=therapist_details.FullName,
        token_type="bearer"
    )
  # ✅ Applies to all endpoints in this router

@admin_router.get("/pending-therapists")
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

@admin_router.post("/approve/{therapist_id}")
def approve_therapist(therapist_id: int, db: Session = Depends(get_db)):
    therapist = db.query(TherapistLogin).filter(TherapistLogin.id == therapist_id).first()
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist not found")
    therapist.is_approved = True
    db.commit()
    return {"message": "Therapist approved successfully"}

@admin_router.delete("/reject/{therapist_id}")
def reject_therapist(therapist_id: int, db: Session = Depends(get_db)):
    login = db.query(TherapistLogin).filter(TherapistLogin.id == therapist_id).first()
    therapist = db.query(Therapist).filter(Therapist.TherapistID == therapist_id).first()
    if login:
        db.delete(login)
    if therapist:
        db.delete(therapist)
    db.commit()
    return {"message": "Therapist rejected and deleted"}

