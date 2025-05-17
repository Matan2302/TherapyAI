from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Date, Text
from src.Backend.database import Base
from sqlalchemy.orm import relationship
# TODO: Add patient email in the SQL DB
# TODO: DateOfBirth should probably be Date instead of DateTime, unless you're storing birth time too.


# Patient Model
class Patient(Base):
    __tablename__ = 'Patients'
    
    PatientID = Column(Integer, primary_key=True)
    FullName = Column(String(100))
    DateOfBirth = Column(DateTime)
    PatientEmail = Column(String(255))
    MedicalHistory = Column(Text)
    
    # Relationship with sessions
    sessions = relationship("Session", back_populates="patient")
    therapist_patients = relationship("TherapistPatient", back_populates="patient")
