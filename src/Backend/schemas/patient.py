# schemas/patient.py

from pydantic import BaseModel
from datetime import datetime

class PatientCreateRequest(BaseModel):
    full_name: str
    dob: datetime
    contact_info: str
    medical_history: str
