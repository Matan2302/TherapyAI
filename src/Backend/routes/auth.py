from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.TherapistLogin import TherapistLogin
from models.Therapist import Therapist
from models.Admin import Admin
from schemas.TherapistLogin import TherapistLoginRequest, TherapistLoginResponse
from schemas.TherapistRegister import TherapistRegisterRequest
from database import get_db
import hashlib
from services.token_service import create_access_token, create_refresh_token, get_current_admin, refresh_access_token, get_current_user, get_current_user
import re
from datetime import datetime

router = APIRouter()
admin_router = APIRouter(dependencies=[Depends(get_current_admin)])

# 📥 Register therapist
@router.post("/register")
def register(data: TherapistRegisterRequest, db: Session = Depends(get_db)):
    print("📥 Register attempt:", data.email)
    
    existing = db.query(TherapistLogin).filter(TherapistLogin.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if not validate_registration_data(data):
        raise HTTPException(status_code=400, detail="One or more fields are invalid.")

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

def validate_registration_data(data) -> bool:
    """
    Validates user registration input data against frontend constraints.
    Returns True if valid, False otherwise.
    """

    full_name = data.full_name.strip()
    specialization = data.specialization.strip()
    contact_info = data.contact_info.strip()
    email = data.email.strip()

    if not re.match(r"^[a-zA-Z0-9\s'-]{2,}$", full_name):
        return False

    if not re.match(r"^[a-zA-Z\s]{3,}$", specialization):
        return False

    if not re.match(r"^05\d{8}$", contact_info):
        return False

    if not re.match(r"^[a-zA-Z0-9._%+-]+@(gmail|outlook|hotmail|yahoo|icloud|walla|live)\.[a-zA-Z]{2,}$", email):
        return False

    return True

def is_password_strong(password: str) -> bool:
    """
    Checks if the password:
    - Has at least one lowercase letter
    - Has at least one uppercase letter
    - Has at least one digit
    - Has at least one special character
    - Is at least 8 characters long
    """
    strong_password_regex = re.compile(
        r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$"
    )
    return bool(strong_password_regex.match(password))

@router.post("/login", response_model=TherapistLoginResponse)
def login(credentials: TherapistLoginRequest, db: Session = Depends(get_db)):
    # Strip whitespace from email and password to handle frontend issues
    email = credentials.email.strip()
    password = credentials.password.strip()

    # Admin check
    admin = db.query(Admin).filter(Admin.Adminusername == email).first()
    if admin:
        # Hash the input password to compare with stored hashed password
        hashed_password_input = hashlib.sha256(password.encode()).hexdigest()
        
        if hashed_password_input == admin.AdminPassword:
            access_token = create_access_token(user_id="admin", role="admin")
            refresh_token = create_refresh_token(user_id="admin", role="admin")
            return TherapistLoginResponse(
                therapist_id=-1,
                access_token=access_token,
                refresh_token=refresh_token,
                full_name="Admin",
                token_type="bearer"
            )

    # Therapist check
    therapist = db.query(TherapistLogin).filter(TherapistLogin.email == email).first()
    if not therapist:
        raise HTTPException(status_code=401, detail="Invalid email")

    hashed_input = hashlib.sha256(password.encode()).hexdigest()
    if hashed_input != therapist.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid password")

    if not therapist.is_approved:
        raise HTTPException(status_code=403, detail="Account pending admin approval")

    access_token = create_access_token(user_id=therapist.id, role="therapist")
    refresh_token = create_refresh_token(user_id=therapist.id, role="therapist")

    therapist_details = db.query(Therapist).filter(Therapist.TherapistID == therapist.id).first()
    return TherapistLoginResponse(
        therapist_id=therapist.id,
        access_token=access_token,
        refresh_token=refresh_token,
        full_name=therapist_details.FullName,
        token_type="bearer"
    )

@router.post("/refresh")
def refresh_token(request: dict, db: Session = Depends(get_db)):
    """
    Refresh access token using a valid refresh token.
    """
    refresh_token = request.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="Refresh token required")
    
    return refresh_access_token(refresh_token, db)


@router.post("/logout")
def logout():
    """
    Logout endpoint - in a stateless JWT system, logout is handled client-side
    by removing tokens from storage. This endpoint exists for consistency.
    """
    return {"message": "Logged out successfully"}


@router.post("/validate-token")
def validate_token(user = Depends(get_current_user)):
    """
    Validate if the current token is still valid.
    """
    return {"valid": True, "user": user}

@router.get("/test-auth")
def test_auth(user = Depends(get_current_user)):
    """
    Test endpoint to verify authentication is working.
    """
    return {
        "message": "Authentication successful!",
        "user": user,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/test-admin")
def test_admin(user = Depends(get_current_admin)):
    """
    Test endpoint to verify admin authentication is working.
    """
    return {
        "message": "Admin authentication successful!",
        "user": user,
        "timestamp": datetime.utcnow().isoformat()
    }

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
    try:
        login = db.query(TherapistLogin).filter(TherapistLogin.id == therapist_id).first()
        therapist = db.query(Therapist).filter(Therapist.TherapistID == therapist_id).first()

        print(f"[DEBUG] login: {login}")
        print(f"[DEBUG] therapist: {therapist}")

        if therapist:
            print("Deleting therapist")
            db.delete(therapist)
        if login:
            print("Deleting login")
            db.delete(login)

        db.commit()
        return {"message": "Therapist rejected and deleted"}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

