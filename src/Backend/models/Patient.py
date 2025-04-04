from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Date, Text
from database import Base
from sqlalchemy.orm import relationship

# Patient Model
class Patient(Base):
    __tablename__ = 'Patients'
    
    PatientID = Column(Integer, primary_key=True)
    FullName = Column(String(100))
    DOB = Column(DateTime)
    PatientEmail = Column(String(255))
    MedicalHistory = Column(Text)
    
    # Relationship with sessions
    sessions = relationship("Session", back_populates="patient")
    therapist_patients = relationship("TherapistPatient", back_populates="patient")
