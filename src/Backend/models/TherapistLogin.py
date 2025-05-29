from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Date, Text,Boolean
from database import Base
from sqlalchemy.orm import relationship
#TODO: change ID to TherapistID or something more meaningful. ID is too generic and can be confused with other IDs in the database.

class TherapistLogin(Base):
    __tablename__ = "TherapistsLogin"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_approved = Column(Boolean, default=False)  # או default=False אם אתה רוצה לאשר ידנית
    



# # TherapistLogin Model (For login credentials of therapists)
# class TherapistLogin(Base):
#     __tablename__ = 'TherapistsLogin'
    
#     id = Column(Integer, primary_key=True)
#     username = Column(String(100))
#     password = Column(String(100))