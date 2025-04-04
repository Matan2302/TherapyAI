from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Date, Text
from database import Base
from sqlalchemy.orm import relationship

class TherapistLogin(Base):
    __tablename__ = "TherapistsLogin"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    


# # TherapistLogin Model (For login credentials of therapists)
# class TherapistLogin(Base):
#     __tablename__ = 'TherapistsLogin'
    
#     id = Column(Integer, primary_key=True)
#     username = Column(String(100))
#     password = Column(String(100))