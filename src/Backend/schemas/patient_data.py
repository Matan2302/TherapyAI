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

class PatientSessionInfo(BaseModel):
    SessionID: int
    SessionDate: str | None
    SessionNotes: str | None
    SessionAnalysis: str | None
    TherapistName: str | None
    IsAnalyzed: bool

class SentimentDetails(BaseModel):
    total_positive: int
    total_negative: int
    top_5_positive: List[str]
    top_5_negative: List[str]
    summary: str

class SentimentAnalysisResponse(BaseModel):
    status: str
    sentiment: SentimentDetails
    analysis_url: str