# routes/patients.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Patient  # מוודאים שיש מודל Patient בקובץ models.py
from schemas.patient import PatientCreateRequest

router = APIRouter()

# פונקציית עזר לקבלת session מהדאטאבייס
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# POST: הוספת מטופל
@router.post("/add")
def add_patient(data: PatientCreateRequest, db: Session = Depends(get_db)):
    print(f"📥 Adding patient: {data.full_name}")

    new_patient = Patient(
        FullName=data.full_name,
        DateOfBirth=data.DateOfBirth,
        PatientEmail=data.contact_info,
        MedicalHistory=data.medical_history
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    
    return {"message": "Patient added successfully", "id": new_patient.PatientID}
