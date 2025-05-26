from pydantic import BaseModel
from typing import List

class PatientDataResponse(BaseModel):
    email: str
    fullName: str
    DateOfBirth: str
    medicalHistory: str
    goodThema: List[int]
    badThema: List[int]
    lastTherapist: str
    lastTherapistEmail: str
    lastTherapistPatientEmail: str
    lastSessionDate: str
    lastSessionNotes: str
    totalSessionsDone: int


class PatientBasicInfo(BaseModel):
    FullName: str
    PatientEmail: str
    DateOfBirth: str | None
    MedicalHistory: str | None