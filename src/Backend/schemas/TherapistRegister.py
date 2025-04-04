from pydantic import BaseModel

class TherapistRegisterRequest(BaseModel):
    full_name: str
    specialization: str
    contact_info: str
    email: str
    password: str
