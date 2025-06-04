from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Date, Text
from database import Base
from sqlalchemy.orm import relationship


# Therapist Model
class Therapist(Base):
    __tablename__ = 'Therapists'
    
    TherapistID = Column(Integer, primary_key=True)
    FullName = Column(String(100))
    Specialization = Column(String(100))
    ContactInfo = Column(String(255))
    
    # Relationship with sessions
    sessions = relationship("Session", back_populates="therapist")
    #therapist_patients = relationship("TherapistPatient", back_populates="therapist")
    