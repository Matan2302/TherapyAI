# services/sql_service.py

from datetime import datetime
import pymssql
import os

# -------------------------------------------------------------------------
# Load DB settings once from env or config
# -------------------------------------------------------------------------
try:
    import config
except ModuleNotFoundError:
    config = None

DB_CONFIG = {
    "server":   os.getenv("DB_SERVER") or getattr(config, "DB_SERVER", None),
    "user":     os.getenv("DB_USER") or getattr(config, "DB_USER", None),
    "password": os.getenv("DB_PASSWORD") or getattr(config, "DB_PASSWORD", None),
    "database": os.getenv("DB_DATABASE") or getattr(config, "DB_DATABASE", None),
}

def _check_db_config():
    missing = [k for k, v in DB_CONFIG.items() if not v]
    if missing:
        raise RuntimeError(
            f"Missing DB settings: {', '.join(missing)}. "
            "Check your .env or config.py."
        )


# -------------------------------------------------------------------------
# DB Functions
# -------------------------------------------------------------------------
def update_session_analysis(session_id: int, analysis_blob_url: str) -> None:
    _check_db_config()
    conn = pymssql.connect(**DB_CONFIG)
    cur = conn.cursor()

    sql = """
        UPDATE dbo.Sessions
        SET analysis = %s, Timestamp = %s
        WHERE SessionID = %s;
    """
    cur.execute(sql, (analysis_blob_url, datetime.utcnow(), session_id))
    conn.commit()
    conn.close()


def get_transcript_url_by_SID(session_id: int) -> str | None:
    _check_db_config()
    conn = pymssql.connect(**DB_CONFIG)
    cur = conn.cursor()

    cur.execute("SELECT Transcript FROM dbo.Sessions WHERE SessionID = %s", (session_id,))
    row = cur.fetchone()
    conn.close()

    return row[0] if row else None

def get_patient_id_by_email(email: str) -> int | None:
    _check_db_config()
    conn = pymssql.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("SELECT PatientID FROM dbo.Patients WHERE PatientEmail = %s", (email,))
    row = cur.fetchone()
    conn.close()
    return row[0] if row else None


def get_therapist_id_by_email(email: str) -> int | None:
    _check_db_config()
    conn = pymssql.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("SELECT id FROM dbo.TherapistsLogin WHERE email = %s", (email,))
    row = cur.fetchone()
    conn.close()
    return row[0] if row else None


def save_session_to_db(
    patient_email: str,
    therapist_name: str,
    session_date: str,   # "YYYY-MM-DD"
    blob_url: str,       # WAV URL
    transcript_url: str, # TXT URL
    notes: str = "",
) -> None:
    _check_db_config()

    try:
        sess_date_obj = datetime.strptime(session_date, "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValueError("session_date must be in YYYY-MM-DD format") from exc
    print(f"patient name: {patient_email}")
    print(f"therapist name: {therapist_name}")
    patient_id = get_patient_id_by_email(patient_email)
    therapist_id = get_therapist_id_by_email(therapist_name)
    print(f"patient_id: {patient_id}")
    print(f"therapist_id: {therapist_id}")
    if not patient_id or not therapist_id:
        raise ValueError("Invalid patient or therapist email")
    
    conn = pymssql.connect(**DB_CONFIG)
    cur = conn.cursor()

    sql = """
        INSERT INTO dbo.Sessions
            (PatientID, TherapistID, SessionDate,
             SessionNotes, BlobURL, Transcript, Timestamp)
        VALUES
            (%s, %s, %s, %s, %s, %s, %s);
    """
    cur.execute(
        sql,
        (
            patient_id,  # PatientID placeholder
            therapist_id,  # TherapistID placeholder
            session_date,
            notes,
            blob_url,
            transcript_url,
            datetime.utcnow(),
        ),
    )
    conn.commit()
    conn.close()
