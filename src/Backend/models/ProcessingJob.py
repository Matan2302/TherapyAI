from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Boolean
from database import Base
from sqlalchemy.orm import relationship
from datetime import datetime

# Processing Job Model for tracking async processing
class ProcessingJob(Base):
    __tablename__ = 'ProcessingJobs'
    
    JobID = Column(String(36), primary_key=True)  # UUID
    PatientEmail = Column(String(255), nullable=False)
    TherapistEmail = Column(String(255), nullable=False)
    SessionDate = Column(String(10), nullable=False)  # YYYY-MM-DD
    SessionNotes = Column(Text, nullable=True)
    
    # File URLs
    AudioURL = Column(String(2083), nullable=False)
    TranscriptURL = Column(String(2083), nullable=True)
    
    # Processing Status
    Status = Column(String(20), default='pending')  # pending, processing, completed, failed
    TranscriptionStatus = Column(String(20), default='pending')  # pending, processing, completed, failed
    
    # Progress tracking
    Progress = Column(Integer, default=0)  # 0-100
    
    # Error handling
    TranscriptionError = Column(Text, nullable=True)
    
    # Timestamps
    CreatedAt = Column(DateTime, default=datetime.utcnow)
    UpdatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    CompletedAt = Column(DateTime, nullable=True)
    
    # Retry logic
    RetryCount = Column(Integer, default=0)
    MaxRetries = Column(Integer, default=3)
