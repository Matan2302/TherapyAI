from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Date, Text,Boolean
from database import Base
from sqlalchemy.orm import relationship
from datetime import datetime

class TherapistLogin(Base):
    __tablename__ = "TherapistsLogin"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_approved = Column(Boolean, default=False)  # או default=False אם אתה רוצה לאשר ידנית
    

class FailedLoginAttempt(Base):
    __tablename__ = "FailedLoginAttempts"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    attempt_count = Column(Integer, default=0)
    last_attempt = Column(DateTime, default=datetime.utcnow)
    lockout_until = Column(DateTime, nullable=True)


# # TherapistLogin Model (For login credentials of therapists)
# class TherapistLogin(Base):
#     __tablename__ = 'TherapistsLogin'
    
#     id = Column(Integer, primary_key=True)
#     username = Column(String(100))
#     password = Column(String(100))