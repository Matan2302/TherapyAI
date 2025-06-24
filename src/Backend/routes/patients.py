from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Patient, Session as SessionModel, Therapist,TherapistLogin
from schemas.patient_data import PatientDataResponse
from fastapi import Query
from typing import List
from schemas.patient_data import PatientBasicInfo  # Make sure this is imported
from schemas.patient_data import PatientSessionInfo  # Make sure this is imported
from services.token_service import get_current_user
import json

router = APIRouter(dependencies=[Depends(get_current_user)])

@router.get("/dashboard-data", response_model=PatientDataResponse)
def get_patient_dashboard_data(
    db: Session = Depends(get_db),
    patient_email: str = Query(...),
    session_id: int = Query(None, description="Optional session ID")
):

    # Initialize variables
    good = []
    bad = []
    therapist_name = ""
    therapist_contact = ""
    therapist_email = "unknown"
    session_date = ""
    session_notes = ""

    patient = db.query(Patient).filter(Patient.PatientEmail == patient_email).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found please check the email or add patient to the system")

    # Fetch the desired session
    if session_id is not None:
        session_query = db.query(SessionModel).filter(
            SessionModel.PatientID == patient.PatientID,
            SessionModel.SessionID == session_id
        )
        session_obj = session_query.first()
        if not session_obj:
            raise HTTPException(status_code=404, detail="Session not found for this patient")
    else:
        session_obj = (
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

    if session_obj:
        try:
            good = json.loads(session_obj.Good_Thema or "[]")
            bad = json.loads(session_obj.Bad_Thema or "[]")
        except Exception:
            good = [0]
            bad = [0]

        session_date = session_obj.SessionDate.strftime("%Y-%m-%d") if session_obj.SessionDate else ""
        session_notes = session_obj.SessionNotes or ""
        therapist = db.query(Therapist).filter(Therapist.TherapistID == session_obj.TherapistID).first()
        if therapist:
            therapist_name = therapist.FullName
            therapist_contact = therapist.ContactInfo
            therapist_login = db.query(TherapistLogin).filter(TherapistLogin.id == therapist.TherapistID).first()
            therapist_email = therapist_login.email if therapist_login else "unknown"

    print(f"goodTHema: {good} , badThema: {bad}")
    return {
        "email": patient.PatientEmail,
        "fullName": patient.FullName,
        "DateOfBirth": patient.DateOfBirth.strftime("%Y-%m-%d"),
        "medicalHistory": patient.MedicalHistory,
        "goodThema": good,
        "badThema": bad,
        "lastTherapist": therapist_name,
        "lastTherapistEmail": therapist_email,
        "lastTherapistPatientEmail": therapist_contact,
        "lastSessionDate": session_date,
        "lastSessionNotes": session_notes,
        "totalSessionsDone": total_sessions
    }

@router.get("/search-patients", response_model=List[PatientBasicInfo])
def search_patients_by_name(
    name: str = Query(..., description="Partial or full patient name"),
    db: Session = Depends(get_db)
):
    patients = db.query(Patient).filter(Patient.FullName.ilike(f"%{name}%")).all()
    return [
        PatientBasicInfo(
            FullName=patient.FullName,
            PatientEmail=patient.PatientEmail,
            DateOfBirth=patient.DateOfBirth.strftime("%Y-%m-%d") if patient.DateOfBirth else None,
            MedicalHistory=patient.MedicalHistory or None
        )
        for patient in patients
    ]

@router.get("/mail-search", response_model=List[PatientBasicInfo])
def search_patients_by_mail(
    name: str = Query(..., description="Partial or full email"),
    db: Session = Depends(get_db)
):
    patients = db.query(Patient).filter(Patient.PatientEmail.ilike(f"%{name}%")).all()
    return [
        PatientBasicInfo(
            FullName=patient.FullName,
            PatientEmail=patient.PatientEmail,
            DateOfBirth=patient.DateOfBirth.strftime("%Y-%m-%d") if patient.DateOfBirth else None,
            MedicalHistory=patient.MedicalHistory or None
        )
        for patient in patients
    ]

@router.get("/all-sessions", response_model=List[PatientSessionInfo])
def get_all_sessions_for_patient(
    patient_email: str = Query(..., description="Patient email"),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.PatientEmail == patient_email).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    sessions = (
        db.query(SessionModel)
        .filter(SessionModel.PatientID == patient.PatientID)
        .order_by(SessionModel.SessionDate.desc())
        .all()
    )


    # You can append an 'IsAnalyzed' field to each session in your result:
    result = []
    for s in sessions:
        therapist = db.query(Therapist).filter(Therapist.TherapistID == s.TherapistID).first()
        therapist_name = therapist.FullName if therapist else None
        is_analyzed = bool(s.analysis and isinstance(s.analysis, str) and s.analysis.startswith("http"))
        result.append(
            PatientSessionInfo(
                SessionID=s.SessionID,
                SessionDate=s.SessionDate.strftime("%Y-%m-%d") if s.SessionDate else None,
                SessionNotes=s.SessionNotes,
                SessionAnalysis=s.analysis,
                TherapistName=therapist_name,
                IsAnalyzed=is_analyzed  # <-- Add this field to your schema
            )
        )
    return result