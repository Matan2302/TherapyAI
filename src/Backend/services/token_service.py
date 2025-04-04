import jwt  # this is PyJWT
from fastapi import HTTPException, status
import config

SECRET_KEY = config.SECRET_KEY  
ALGORITHM = config.ALGORITHM
def verify_token(token: str):
    print("Token is:", token)

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")  # לפי מה ששמת כשיצרת את הטוקן
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload missing 'sub'",
            )
        return user_id  # או: return payload אם אתה צריך את כל המידע
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

