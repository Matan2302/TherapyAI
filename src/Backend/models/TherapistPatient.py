from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Date, Text
from src.Backend.database import Base
from sqlalchemy.orm import relationship

# TherapistPatient Model (Many-to-Many Relationship between Therapists and Patients)
class TherapistPatient(Base):
    __tablename__ = 'TherapistPatient'
    
    TherapistPatientID = Column(Integer, primary_key=True)
    TherapistID = Column(Integer, ForeignKey('Therapists.TherapistID'))
    PatientID = Column(Integer, ForeignKey('Patients.PatientID'))
    StartDate = Column(DateTime)
    EndDate = Column(DateTime)
    Notes = Column(Text)
    
    # Relationships
    therapist = relationship("Therapist", back_populates="therapist_patients")
    patient = relationship("Patient", back_populates="therapist_patients")