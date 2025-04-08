from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from services.token_service import verify_token
from database import SessionLocal
from models import Patient, Session as SessionModel, Therapist,TherapistLogin
from schemas.patient_data import PatientDataResponse
from fastapi import Query

import json

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/dashboard-data", response_model=PatientDataResponse)
def get_patient_dashboard_data(
    db: Session = Depends(get_db),
    patient_email: str = Query(...)
):
    print(f"Patient email received: {patient_email}")
    # Step 1: verify token and extract payload
    
    # For now, hardcoded patient email (you can get from request param later)

    patient = db.query(Patient).filter(Patient.PatientEmail == patient_email).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found please check the email or add patient to the system")

    last_session = (
    db.query(SessionModel)
    .filter(SessionModel.PatientID == patient.PatientID)
    .order_by(SessionModel.Timestamp.desc())
    .first()
    )

    total_sessions = (
        db.query(SessionModel)
        .filter(SessionModel.PatientID == patient.PatientID)
        .count()
    )

    good = []
    bad = []
    therapist_name = ""
    therapist_contact = ""
    session_date = ""
    session_notes = ""

    if last_session:
        try:
            good = json.loads(last_session.Good_Thema or "[]")
            bad = json.loads(last_session.Bad_Thema or "[]")
        except Exception:
            good = [0]
            bad = [0]

        session_date = last_session.SessionDate.strftime("%Y-%m-%d") if last_session.SessionDate else ""
        session_notes = last_session.SessionNotes or ""
        print(last_session.TherapistID)
        therapist = db.query(Therapist).filter(Therapist.TherapistID == last_session.TherapistID).first()
        if therapist:
            therapist_name = therapist.FullName
            therapist_contact = therapist.ContactInfo
            therapist_login = db.query(TherapistLogin).filter(TherapistLogin.id == therapist.TherapistID).first()
            therapist_email = therapist_login.email if therapist_login else "unknown"

    print(f"goodTHema: {good} , badThema: {bad}")
    return {
        "email": patient.PatientEmail,
        "fullName": patient.FullName,
        "dob": patient.DOB.strftime("%Y-%m-%d"),
        "medicalHistory": patient.MedicalHistory,
        "goodThema": good,
        "badThema": bad,
        "lastTherapist": therapist_name,
        "lastTherapistEmail": therapist_email,  # You can link with TherapistLogin later
        "lastTherapistContactInfo": therapist_contact,
        "lastSessionDate": session_date,
        "lastSessionNotes": session_notes,
        "totalSessionsDone": total_sessions
    }
