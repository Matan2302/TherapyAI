from datetime import datetime
from fastapi import HTTPException, Depends, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import ExpiredSignatureError, InvalidTokenError

from sqlalchemy.orm import Session

from database import get_db
from models.TherapistLogin import TherapistLogin
from config import SECRET_KEY

# Basic config
ALGORITHM = "HS256"
bearer_scheme = HTTPBearer()

# ==========================
# TOKEN CREATION / DECODING
# ==========================

def create_access_token(user_id: int | str, role: str) -> str:
    """
    Create a signed JWT token without expiration (session-style).
    You may later add exp if needed.
    """
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": datetime.utcnow().timestamp()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")



# ==========================
# FASTAPI DEPENDENCIES
# ==========================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
    db: Session = Depends(get_db)
):
    """
    Validates a Bearer token and returns either an admin identity or a therapist object.
    """
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("sub")
        role = payload.get("role")

        if role == "admin":
            return {"id": "admin", "role": "admin"}

        therapist = db.query(TherapistLogin).filter(TherapistLogin.id == int(user_id)).first()

        if not therapist or not therapist.is_approved:
            raise HTTPException(status_code=401, detail="User not found or not approved")

        return {"id": therapist.id, "role": "therapist"}

    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")


def get_current_admin(user = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    return user
