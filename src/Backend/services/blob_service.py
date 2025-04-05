import os
from datetime import datetime, timedelta
from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
from azure.storage.blob import AccountSasPermissions, ResourceTypes, generate_account_sas
import pymssql
from config import AZURE_BLOB_CONN_STRING, AZURE_BLOB_CONTAINER_NAME
from config import BLOB_SERVER_NAME, BLOB_USER, BLOB_PASSWORD, BLOB_DATABASE
from config import DB_SERVER,DB_PASSWORD,DB_DATABASE,DB_USER,BLOB_DATABASE

blob_service_client = BlobServiceClient.from_connection_string(AZURE_BLOB_CONN_STRING)

def get_blob_sas_url(blob_name: str) -> str:
    # Generate SAS token that's valid for 1 hour
    sas_token = generate_blob_sas(
        account_name=blob_service_client.account_name,
        container_name=AZURE_BLOB_CONTAINER_NAME,
        blob_name=blob_name,
        account_key=blob_service_client.credential.account_key,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.utcnow() + timedelta(hours=1)
    )
    
    # Construct the URL with SAS token
    blob_url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{AZURE_BLOB_CONTAINER_NAME}/{blob_name}?{sas_token}"
    return blob_url

def upload_to_azure(file_path: str, file_name: str) -> str:
    blob_client = blob_service_client.get_blob_client(container=AZURE_BLOB_CONTAINER_NAME, blob=file_name)
    with open(file_path, "rb") as data:
        blob_client.upload_blob(data, overwrite=True)
    return get_blob_sas_url(file_name)

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
