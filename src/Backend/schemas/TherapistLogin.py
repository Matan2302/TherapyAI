from pydantic import BaseModel

# Input from frontend
class TherapistLoginRequest(BaseModel):
    email: str
    password: str

# Response to frontend
class TherapistLoginResponse(BaseModel):
    therapist_id: int
    access_token: str
    full_name :str
    token_type: str = "bearer"

class ForgotPasswordRequest(BaseModel):
    email: str

class VerifyResetCodeRequest(BaseModel):
    email: str
    code: str
    new_password: str