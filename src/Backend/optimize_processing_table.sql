-- Optimized ProcessingJobs table schema
-- This removes unnecessary sentiment-related columns

-- Drop the old table if you want to recreate it
-- DROP TABLE IF EXISTS ProcessingJobs;

-- Create optimized table
CREATE TABLE ProcessingJobsOptimized (
    JobID NVARCHAR(36) PRIMARY KEY,
    PatientEmail NVARCHAR(255) NOT NULL,
    TherapistEmail NVARCHAR(255) NOT NULL,
    SessionDate NVARCHAR(10) NOT NULL,
    SessionNotes NTEXT NULL,
    AudioURL NVARCHAR(2083) NOT NULL,
    TranscriptURL NVARCHAR(2083) NULL,
    Status NVARCHAR(20) DEFAULT 'pending',           -- pending, processing, completed, failed
    TranscriptionStatus NVARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    Progress INT DEFAULT 0,                          -- 0-100%
    TranscriptionError NTEXT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CompletedAt DATETIME NULL,
    RetryCount INT DEFAULT 0,
    MaxRetries INT DEFAULT 3
);

-- If you want to migrate existing data:
-- INSERT INTO ProcessingJobsOptimized SELECT JobID, PatientEmail, TherapistEmail, SessionDate, SessionNotes, AudioURL, TranscriptURL, Status, TranscriptionStatus, Progress, TranscriptionError, CreatedAt, UpdatedAt, CompletedAt, RetryCount, MaxRetries FROM ProcessingJobs;

-- Then rename tables:
-- DROP TABLE ProcessingJobs;
-- EXEC sp_rename 'ProcessingJobsOptimized', 'ProcessingJobs';
