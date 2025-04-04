
import os
from datetime import datetime
from azure.storage.blob import BlobServiceClient
import pymssql
from config import AZURE_BLOB_CONN_STRING, AZURE_BLOB_CONTAINER_NAME
from config import BLOB_SERVER_NAME, BLOB_USER, BLOB_PASSWORD, BLOB_DATABASE
from config import DB_SERVER,DB_PASSWORD,DB_DATABASE,DB_USER,BLOB_DATABASE

blob_service_client = BlobServiceClient.from_connection_string(AZURE_BLOB_CONN_STRING)

def upload_to_azure(file_path: str, file_name: str) -> str:
    blob_client = blob_service_client.get_blob_client(container=AZURE_BLOB_CONTAINER_NAME, blob=file_name)
    with open(file_path, "rb") as data:
        blob_client.upload_blob(data, overwrite=True)
    return f"https://{blob_service_client.account_name}.blob.core.windows.net/{AZURE_BLOB_CONTAINER_NAME}/{file_name}"

def save_session_to_db(patient_name, therapist_name, session_date, blob_url):
    db_config = {
        "server": DB_SERVER,
        "user": DB_USER,
        "password": DB_PASSWORD,
        "database": DB_DATABASE,
    }
    conn = pymssql.connect(**db_config)
    cursor = conn.cursor()
    query = """INSERT INTO dbo.Sessions (PatientID, TherapistID, SessionDate, BlobURL, Timestamp) VALUES (%s, %s, %s, %s, %s)"""
    cursor.execute(query, (1, 1, session_date, blob_url, datetime.now()))
    conn.commit()
    conn.close()
