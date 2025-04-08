
import json
import os
from datetime import datetime
from azure.storage.blob import BlobServiceClient
import pymssql
from database import SessionLocal
from config import AZURE_BLOB_CONN_STRING, AZURE_BLOB_CONTAINER_NAME
from config import BLOB_SERVER_NAME, BLOB_USER, BLOB_PASSWORD, BLOB_DATABASE
from config import DB_SERVER,DB_PASSWORD,DB_DATABASE,DB_USER,BLOB_DATABASE

blob_service_client = BlobServiceClient.from_connection_string(AZURE_BLOB_CONN_STRING)

def upload_to_azure(file_path: str, file_name: str) -> str:
    blob_client = blob_service_client.get_blob_client(container=AZURE_BLOB_CONTAINER_NAME, blob=file_name)
    with open(file_path, "rb") as data:
        blob_client.upload_blob(data, overwrite=True)
    return f"https://{blob_service_client.account_name}.blob.core.windows.net/{AZURE_BLOB_CONTAINER_NAME}/{file_name}"

def save_session_to_db(patient_name, therapist_name, session_date, blob_url, notes):
    print(f"Received: {patient_name}, {therapist_name}, {session_date}, {notes}, {blob_url}")

    # Get a raw DBAPI connection from SQLAlchemy
    with SessionLocal() as db_session:
        conn = db_session.connection().connection  # this gives you the raw pyodbc connection
        cursor = conn.cursor()

        query = """INSERT INTO dbo.Sessions 
            (PatientID, TherapistID, SessionDate, BlobURL, Timestamp, SessionNotes ,[Good Thema], [Bad Thema]) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)"""  # use ? for pyodbc!
        good_str = json.dumps([2,7,8])
        bad_str = json.dumps([7,3,0])
        cursor.execute(query, (1, 15, session_date, blob_url, datetime.now(), notes,good_str ,bad_str ))

        conn.commit()
        cursor.close()
