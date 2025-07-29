from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.TherapistLogin import TherapistLogin, FailedLoginAttempt
from models.Therapist import Therapist
from models.Admin import Admin  # ✅ ייבוא מודל אדמין
from schemas.TherapistLogin import TherapistLoginRequest, TherapistLoginResponse, ForgotPasswordRequest, VerifyResetCodeRequest
from schemas.TherapistRegister import TherapistRegisterRequest
from database import get_db, SessionLocal
import hashlib
import jwt
from services.token_service import create_access_token, get_current_admin, decode_access_token
import re
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


from config import SECRET_KEY, SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL, SMTP_USE_TLS
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
router = APIRouter()
admin_router = APIRouter(dependencies=[Depends(get_current_admin)])
print("✅ auth.py loaded")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_lockout(db: Session, email: str) -> tuple[bool, str]:
    failed_attempt = db.query(FailedLoginAttempt).filter(FailedLoginAttempt.email == email).first()
    now = datetime.utcnow()
    if not failed_attempt:
        return False, ""
    if failed_attempt.lockout_until and failed_attempt.lockout_until > now:
        # Determine the stage by attempt_count
        if failed_attempt.attempt_count == 3:
            return True, "Please wait 2 minutes before trying again"
        elif failed_attempt.attempt_count == 4:
            return True, "Please wait 1 hour before trying again"
        elif failed_attempt.attempt_count == 5 or failed_attempt.attempt_count == 0:
            return True, "Please wait 1 day before trying again"
        else:
            # fallback: show generic message with time left
            time_left = failed_attempt.lockout_until - now
            return True, f"Please wait {str(time_left)} before trying again"
    return False, ""

def update_failed_attempt(db: Session, email: str):
    failed_attempt = db.query(FailedLoginAttempt).filter(FailedLoginAttempt.email == email).first()
    now = datetime.utcnow()

    if not failed_attempt:
        failed_attempt = FailedLoginAttempt(email=email)
        db.add(failed_attempt)

    if failed_attempt.attempt_count is None:
        failed_attempt.attempt_count = 0

    # If lockout expired, move to next stage
    if failed_attempt.lockout_until and failed_attempt.lockout_until < now:
        # Move to next lockout stage
        if failed_attempt.attempt_count == 3:
            failed_attempt.attempt_count = 4
            failed_attempt.lockout_until = now + timedelta(hours=1)
        elif failed_attempt.attempt_count == 4:
            failed_attempt.attempt_count = 5
            failed_attempt.lockout_until = now + timedelta(days=1)
        elif failed_attempt.attempt_count >= 5:
            # After 1 day, reset everything
            failed_attempt.attempt_count = 1
            failed_attempt.lockout_until = None
        else:
            failed_attempt.attempt_count += 1
            failed_attempt.lockout_until = None
    else:
        failed_attempt.attempt_count += 1
        if failed_attempt.attempt_count == 3:
            failed_attempt.lockout_until = now + timedelta(minutes=2)
        elif failed_attempt.attempt_count == 4:
            failed_attempt.lockout_until = now + timedelta(hours=1)
        elif failed_attempt.attempt_count >= 5:
            failed_attempt.lockout_until = now + timedelta(days=1)
            failed_attempt.attempt_count = 0

    failed_attempt.last_attempt = now
    db.commit()

def reset_failed_attempt(db: Session, email: str):
    failed_attempt = db.query(FailedLoginAttempt).filter(FailedLoginAttempt.email == email).first()
    if failed_attempt:
        failed_attempt.attempt_count = 0
        failed_attempt.lockout_until = None
        db.commit()

def send_reset_email(email: str, reset_token: str):
    msg = MIMEMultipart()
    msg['From'] = SMTP_FROM_EMAIL
    msg['To'] = email
    msg['Subject'] = "Password Reset Request"
    
    body = f"""
    You have requested to reset your password.
    Please use the following code to reset your password: {reset_token}
    
    This code will expire in 15 minutes.
    If you did not request this reset, please ignore this email.
    """
    
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        if SMTP_USE_TLS:
            server.starttls()
        
        # Only attempt login if credentials are provided
        if SMTP_USERNAME and SMTP_PASSWORD:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
        
        server.send_message(msg)
        server.quit()
    except smtplib.SMTPAuthenticationError:
        print("SMTP Authentication failed. Please check your SMTP credentials.")
        raise HTTPException(status_code=500, detail="Email service configuration error")
    except smtplib.SMTPException as e:
        print(f"SMTP error occurred: {e}")
        raise HTTPException(status_code=500, detail="Failed to send reset email")
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send reset email")

# 📥 התחברות
@router.post("/login", response_model=TherapistLoginResponse)
def login(credentials: TherapistLoginRequest, db: Session = Depends(get_db)):
    print(db)
    print("🔐 login called with:", credentials.email)

    # Check for lockout
    is_locked, message = check_lockout(db, credentials.email)
    if is_locked:
        raise HTTPException(status_code=429, detail=message)

    # 🔒 בדיקה אם המשתמש הוא אדמין (לפי Adminusername)
    admin = db.query(Admin).filter(Admin.Adminusername == credentials.email).first()
    if admin:
        if credentials.password == admin.AdminPassword:  # אין צורך ב-hash
            print("👑 Admin login successful")
            access_token = create_access_token(user_id="admin", role="admin")
            return TherapistLoginResponse(
                therapist_id=-1,
                access_token=access_token,
                full_name="Admin",
                token_type="bearer"
            )
        else:
            update_failed_attempt(db, credentials.email)
            raise HTTPException(status_code=401, detail="Invalid admin password")

    # 🔄 אם לא אדמין, בדיקה רגילה של מטפל
    therapist = db.query(TherapistLogin).filter(TherapistLogin.email == credentials.email).first()

    if not therapist:
        update_failed_attempt(db, credentials.email)
        raise HTTPException(status_code=401, detail="Invalid email")

    hashed_input = hashlib.sha256(credentials.password.encode()).hexdigest()
    if hashed_input != therapist.hashed_password:
        update_failed_attempt(db, credentials.email)
        raise HTTPException(status_code=401, detail="Invalid password")

    if not therapist.is_approved:
        raise HTTPException(status_code=403, detail="Account pending admin approval")

    # Reset failed attempts on successful login
    reset_failed_attempt(db, credentials.email)

    # Generate JWT token using the token service
    access_token = create_access_token(user_id=therapist.id, role="therapist")

    therapist_details = db.query(Therapist).filter(Therapist.TherapistID == therapist.id).first()
    if not therapist_details:
        raise HTTPException(status_code=404, detail="Therapist details not found")

    return TherapistLoginResponse(
        therapist_id=therapist.id,
        access_token=access_token,
        full_name=therapist_details.FullName,
        token_type="bearer"
    )



def is_password_strong(password: str) -> bool:
    if len(password) < 7:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    return True

@router.get("/verify")
def verify_token_route(token: str = Depends(oauth2_scheme)):
    print("Received token:", token)
    decode_access_token(token)
    return {"valid": True}
# admin_router = APIRouter(dependencies=[Depends(get_current_admin)])


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

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = request.email
    therapist = db.query(TherapistLogin).filter(TherapistLogin.email == email).first()
    if not therapist:
        raise HTTPException(status_code=404, detail="Email not found")
    # Generate reset token
    reset_token = secrets.token_hex(4)  # 8 characters
    therapist.reset_token = reset_token
    therapist.reset_token_expiry = datetime.utcnow() + timedelta(minutes=15)
    db.commit()
    # Send reset email
    send_reset_email(email, reset_token)
    return {"message": "Reset code sent to your email"}

@router.post("/verify-reset-code")
def verify_reset_code(request: VerifyResetCodeRequest, db: Session = Depends(get_db)):
    email = request.email
    code = request.code
    new_password = request.new_password
    therapist = db.query(TherapistLogin).filter(TherapistLogin.email == email).first()
    if not therapist:
        raise HTTPException(status_code=404, detail="Email not found")
    if not therapist.reset_token or not therapist.reset_token_expiry:
        raise HTTPException(status_code=400, detail="No reset code requested")
    if datetime.utcnow() > therapist.reset_token_expiry:
        raise HTTPException(status_code=400, detail="Reset code has expired")
    if therapist.reset_token != code:
        raise HTTPException(status_code=400, detail="Invalid reset code")
    if not is_password_strong(new_password):
        raise HTTPException(status_code=400, detail="Password is not strong enough")
    # Update password
    hashed_password = hashlib.sha256(new_password.encode()).hexdigest()
    therapist.hashed_password = hashed_password
    therapist.reset_token = None
    therapist.reset_token_expiry = None
    db.commit()
    return {"message": "Password updated successfully"}

