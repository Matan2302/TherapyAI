"""
Database migration script to create the ProcessingJob table
Run this script to add the new table for async processing
"""

import sys
import os
import pymssql
from datetime import datetime

# Add the Backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__)))

from config import DB_SERVER, DB_USER, DB_PASSWORD, DB_DATABASE

def create_processing_job_table():
    """Create the ProcessingJob table using raw SQL"""
    try:
        print("Connecting to database...")
        conn = pymssql.connect(
            server=DB_SERVER,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_DATABASE
        )
        cursor = conn.cursor()
        
        print("Creating ProcessingJob table...")
        
        # Create the ProcessingJob table (optimized schema)
        create_table_sql = """
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProcessingJobs' AND xtype='U')
        CREATE TABLE ProcessingJobs (
            JobID NVARCHAR(36) PRIMARY KEY,
            PatientEmail NVARCHAR(255) NOT NULL,
            TherapistEmail NVARCHAR(255) NOT NULL,
            SessionDate NVARCHAR(10) NOT NULL,
            SessionNotes NTEXT NULL,
            AudioURL NVARCHAR(2083) NOT NULL,
            TranscriptURL NVARCHAR(2083) NULL,
            Status NVARCHAR(20) DEFAULT 'pending',
            TranscriptionStatus NVARCHAR(20) DEFAULT 'pending',
            Progress INT DEFAULT 0,
            TranscriptionError NTEXT NULL,
            CreatedAt DATETIME DEFAULT GETDATE(),
            UpdatedAt DATETIME DEFAULT GETDATE(),
            CompletedAt DATETIME NULL,
            RetryCount INT DEFAULT 0,
            MaxRetries INT DEFAULT 3
        )
        """
        
        cursor.execute(create_table_sql)
        conn.commit()
        
        print("✅ ProcessingJob table created successfully!")
        
        # Test the table
        cursor.execute("SELECT COUNT(*) FROM ProcessingJobs")
        count = cursor.fetchone()[0]
        print(f"✅ Table test successful! Current records: {count}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error creating table: {e}")
        raise

if __name__ == "__main__":
    create_processing_job_table()
