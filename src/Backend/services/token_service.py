from datetime import datetime
from fastapi import HTTPException, Depends, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import ExpiredSignatureError, InvalidTokenError
from sqlalchemy.orm import Session
from datetime import timedelta
from database import get_db
from models.TherapistLogin import TherapistLogin
from config import SECRET_KEY

# Basic config
ALGORITHM = "HS256"
bearer_scheme = HTTPBearer()

# ==========================
# TOKEN CREATION / DECODING
# ==========================

def create_access_token(user_id: int | str, role: str, expires_delta: timedelta = None) -> str:
    """
    Create a signed JWT token with expiration.
    Default expiration is 24 hours for regular users, 4 hours for admins.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Default expiration: 4 hours for admins, 24 hours for therapists
        hours = 4 if role == "admin" else 24
        expire = datetime.utcnow() + timedelta(hours=hours)
    
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": datetime.utcnow().timestamp(),
        "exp": expire.timestamp()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: int | str, role: str) -> str:
    """
    Create a refresh token with longer expiration (7 days).
    """
    expire = datetime.utcnow() + timedelta(days=7)
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "refresh",
        "iat": datetime.utcnow().timestamp(),
        "exp": expire.timestamp()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decode and validate JWT token.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def is_token_expired(token: str) -> bool:
    """
    Check if token is expired without raising an exception.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp = payload.get("exp")
        if exp is None:
            return False  # No expiration set
        return datetime.utcnow().timestamp() > exp
    except:
        return True  # If we can't decode, consider it expired



# ==========================
# TOKEN REFRESH
# ==========================

def refresh_access_token(refresh_token: str, db: Session) -> dict:
    """
    Generate a new access token using a valid refresh token.
    """
    try:
        payload = decode_access_token(refresh_token)
        
        # Verify it's a refresh token
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        user_id = payload.get("sub")
        role = payload.get("role")
        
        # Verify user still exists and is approved (for therapists)
        if role == "therapist":
            therapist = db.query(TherapistLogin).filter(TherapistLogin.id == int(user_id)).first()
            if not therapist or not therapist.is_approved:
                raise HTTPException(status_code=401, detail="User no longer authorized")
        
        # Generate new tokens
        new_access_token = create_access_token(user_id, role)
        new_refresh_token = create_refresh_token(user_id, role)
        
        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }
        
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


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
