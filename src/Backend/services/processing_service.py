import uuid
import threading
import time
import pymssql
import json
from datetime import datetime
from typing import Optional, Dict, Any
from services.azure_transcription import transcribe_dialog
from services.azure_sentiment import analyze_sentiment_from_blob
from services.blob_service import create_sas_url
from services.sql_service import get_patient_id_by_email, get_therapist_id_by_email
from config import DB_SERVER, DB_USER, DB_PASSWORD, DB_DATABASE

class ProcessingJobService:
    def __init__(self):
        self.processing_threads = {}
        
    def _get_db_connection(self):
        """Get database connection"""
        return pymssql.connect(
            server=DB_SERVER,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_DATABASE
        )
import uuid
import threading
import time
import pymssql
import json
from datetime import datetime
from typing import Optional, Dict, Any
from services.azure_transcription import transcribe_dialog
from services.azure_sentiment import analyze_sentiment_from_blob
from services.blob_service import create_sas_url
from services.sql_service import get_patient_id_by_email, get_therapist_id_by_email
from config import DB_SERVER, DB_USER, DB_PASSWORD, DB_DATABASE

class ProcessingJobService:
    def __init__(self):
        self.processing_threads = {}
        
    def _get_db_connection(self):
        """Get database connection"""
        return pymssql.connect(
            server=DB_SERVER,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_DATABASE
        )
        
    def create_job(self, 
                   patient_email: str, 
                   therapist_email: str, 
                   session_date: str, 
                   session_notes: str, 
                   audio_url: str) -> str:
        """Create a new processing job and return job ID"""
        job_id = str(uuid.uuid4())
        
        conn = self._get_db_connection()
        cursor = conn.cursor()
        
        try:
            sql = """
            INSERT INTO ProcessingJobs 
            (JobID, PatientEmail, TherapistEmail, SessionDate, SessionNotes, AudioURL, Status, Progress)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                job_id, patient_email, therapist_email, session_date, 
                session_notes, audio_url, 'pending', 0
            ))
            conn.commit()
            
            # Start background processing
            self.start_processing(job_id)
            
            return job_id
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
            conn.close()
    
    def start_processing(self, job_id: str):
        """Start background processing for a job"""
        thread = threading.Thread(target=self._process_job, args=(job_id,))
        thread.daemon = True
        thread.start()
        self.processing_threads[job_id] = thread
    
    def _process_job(self, job_id: str):
        """Background processing function"""
        conn = self._get_db_connection()
        cursor = conn.cursor()
        
        try:
            # Get job details
            cursor.execute("SELECT * FROM ProcessingJobs WHERE JobID = %s", (job_id,))
            job_row = cursor.fetchone()
            if not job_row:
                print(f"Job {job_id} not found")
                return
            
            # Update status to processing
            cursor.execute("""
                UPDATE ProcessingJobs 
                SET Status = %s, Progress = %s, UpdatedAt = %s 
                WHERE JobID = %s
            """, ('processing', 10, datetime.utcnow(), job_id))
            conn.commit()
            
            # Extract job data
            audio_url = job_row[6]  # AudioURL column
            
            # Step 1: Transcription
            transcript_url = None
            try:
                cursor.execute("""
                    UPDATE ProcessingJobs 
                    SET TranscriptionStatus = %s, Progress = %s, UpdatedAt = %s 
                    WHERE JobID = %s
                """, ('processing', 20, datetime.utcnow(), job_id))
                conn.commit()
                
                # Extract filename from audio URL for SAS
                filename = audio_url.split('/')[-1]
                sas_url = create_sas_url(f"recordings/{filename}", minutes=120)
                
                print(f"Starting transcription for job {job_id}")
                _, transcript_url = transcribe_dialog(sas_url, locale="he-IL")
                
                cursor.execute("""
                    UPDATE ProcessingJobs 
                    SET TranscriptURL = %s, TranscriptionStatus = %s, Progress = %s, UpdatedAt = %s 
                    WHERE JobID = %s
                """, (transcript_url, 'completed', 60, datetime.utcnow(), job_id))
                conn.commit()
                
                print(f"Transcription completed for job {job_id}")
                
            except Exception as e:
                cursor.execute("""
                    UPDATE ProcessingJobs 
                    SET TranscriptionStatus = %s, TranscriptionError = %s, Progress = %s, UpdatedAt = %s 
                    WHERE JobID = %s
                """, ('failed', str(e), 30, datetime.utcnow(), job_id))
                conn.commit()
                print(f"Transcription failed for job {job_id}: {e}")
            
            # Step 2: Skip sentiment analysis during upload (will be done on-demand in patient dashboard)
            cursor.execute("""
                UPDATE ProcessingJobs 
                SET Progress = %s, UpdatedAt = %s 
                WHERE JobID = %s
            """, (90, datetime.utcnow(), job_id))
            conn.commit()
            print(f"Sentiment analysis skipped for job {job_id} - will be done on-demand")
            
            # Step 3: Save to Sessions table
            try:
                # Get job details again for the session save
                cursor.execute("SELECT * FROM ProcessingJobs WHERE JobID = %s", (job_id,))
                job_row = cursor.fetchone()
                
                patient_email = job_row[2]
                therapist_email = job_row[3]
                session_date = job_row[4]
                session_notes = job_row[5]
                
                patient_id = get_patient_id_by_email(patient_email)
                therapist_id = get_therapist_id_by_email(therapist_email)
                
                if patient_id and therapist_id:
                    # Insert into Sessions table
                    cursor.execute("""
                        INSERT INTO Sessions 
                        (PatientID, TherapistID, SessionDate, SessionNotes, BlobURL, Transcript, Timestamp, analysis)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        patient_id, therapist_id, 
                        datetime.strptime(session_date, "%Y-%m-%d").date(),
                        session_notes, audio_url, transcript_url, 
                        datetime.utcnow(), 
                        None  # analysis will be done on-demand in patient dashboard
                    ))
                    conn.commit()
                    
                    # Get the new session ID
                    cursor.execute("SELECT @@IDENTITY")
                    session_id = cursor.fetchone()[0]
                    
                    # Update job with session ID and completion
                    cursor.execute("""
                        UPDATE ProcessingJobs 
                        SET SessionID = %s, Status = %s, Progress = %s, CompletedAt = %s, UpdatedAt = %s 
                        WHERE JobID = %s
                    """, (session_id, 'completed', 100, datetime.utcnow(), datetime.utcnow(), job_id))
                    conn.commit()
                    
                    print(f"Job {job_id} completed successfully")
                else:
                    raise Exception("Invalid patient or therapist email")
                    
            except Exception as e:
                cursor.execute("""
                    UPDATE ProcessingJobs 
                    SET Status = %s, TranscriptionError = %s, UpdatedAt = %s 
                    WHERE JobID = %s
                """, ('failed', f"Database save failed: {str(e)}", datetime.utcnow(), job_id))
                conn.commit()
                print(f"Database save failed for job {job_id}: {e}")
        
        except Exception as e:
            cursor.execute("""
                UPDATE ProcessingJobs 
                SET Status = %s, TranscriptionError = %s, UpdatedAt = %s 
                WHERE JobID = %s
            """, ('failed', f"Processing failed: {str(e)}", datetime.utcnow(), job_id))
            conn.commit()
            print(f"Job {job_id} failed: {e}")
        
        finally:
            cursor.close()
            conn.close()
            # Remove from active threads
            if job_id in self.processing_threads:
                del self.processing_threads[job_id]
    
    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get current status of a processing job"""
        conn = self._get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT * FROM ProcessingJobs WHERE JobID = %s", (job_id,))
            job_row = cursor.fetchone()
            
            if not job_row:
                return None
                
            return {
                "job_id": job_row[0],
                "patient_email": job_row[1],
                "therapist_email": job_row[2],
                "session_date": job_row[3],
                "session_notes": job_row[4],
                "audio_url": job_row[5],
                "transcript_url": job_row[6],
                "status": job_row[7],
                "transcription_status": job_row[8],
                "progress": job_row[9],
                "transcription_error": job_row[10],
                "created_at": job_row[11].isoformat() if job_row[11] else None,
                "updated_at": job_row[12].isoformat() if job_row[12] else None,
                "completed_at": job_row[13].isoformat() if job_row[13] else None,
                "retry_count": job_row[14],
                "max_retries": job_row[15]
            }
        finally:
            cursor.close()
            conn.close()
    
    def retry_job(self, job_id: str) -> bool:
        """Retry a failed job"""
        conn = self._get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT RetryCount, MaxRetries FROM ProcessingJobs WHERE JobID = %s", (job_id,))
            job_row = cursor.fetchone()
            
            if not job_row or job_row[0] >= job_row[1]:
                return False
            
            # Update retry count and reset status
            cursor.execute("""
                UPDATE ProcessingJobs 
                SET RetryCount = %s, Status = %s, Progress = %s, 
                    TranscriptionError = NULL, 
                    TranscriptionStatus = %s, UpdatedAt = %s
                WHERE JobID = %s
            """, (job_row[0] + 1, 'pending', 0, 'pending', datetime.utcnow(), job_id))
            conn.commit()
            
            # Start processing again
            self.start_processing(job_id)
            return True
            
        except Exception as e:
            conn.rollback()
            print(f"Failed to retry job {job_id}: {e}")
            return False
        finally:
            cursor.close()
            conn.close()

# Global instance
processing_service = ProcessingJobService()
