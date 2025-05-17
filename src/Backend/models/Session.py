from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Date, Text
from src.Backend.database import Base
from sqlalchemy.orm import relationship
#TODO: Good_Thema and Bad_Thema are Text, but you probably store something like JSON lists? If yes — consider using JSON type or parse when reading.
#TODO: Either SessionDate or Timestamp is likely redundant. You can merge them or choose one as the official session date.

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
    # Good_Thema = Column("Good Thema", Text)
    # Bad_Thema = Column("Bad Thema", Text)
    
    # Relationships
    patient = relationship("Patient", back_populates="sessions")
    therapist = relationship("Therapist", back_populates="sessions")
