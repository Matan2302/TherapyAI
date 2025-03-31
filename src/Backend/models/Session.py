from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Date, Text
from database import Base
from sqlalchemy.orm import relationship

# Session Model
class Session(Base):
    __tablename__ = 'Sessions'
    
    SessionID = Column(Integer, primary_key=True)
    PatientID = Column(Integer, ForeignKey('Patients.PatientID'))
    TherapistID = Column(Integer, ForeignKey('Therapists.TherapistID'))
    SessionDate = Column(DateTime)
    SessionNotes = Column(Text)
    BlobURL = Column(String(2083))
    Transcript = Column(Text)
    Timestamp = Column(DateTime)
    Good_Thema = Column(Text)
    Bad_Thema = Column(Text)
    
    # Relationships
    patient = relationship("Patient", back_populates="sessions")
    therapist = relationship("Therapist", back_populates="sessions")
