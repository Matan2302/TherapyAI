from pydantic import BaseModel
from typing import List

class PatientDataResponse(BaseModel):
    email: str
    fullName: str
    dob: str
    medicalHistory: str
    goodThema: List[int]
    badThema: List[int]
    lastTherapist: str
    lastTherapistEmail: str
    lastTherapistContactInfo: str
    lastSessionDate: str
    lastSessionNotes: str
    totalSessionsDone: int