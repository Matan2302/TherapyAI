from fastapi import FastAPI, File, UploadFile, Form
import pymssql
import aiofiles
import os
from datetime import datetime
from azure.storage.blob import BlobServiceClient
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
load_dotenv()

# Hardcoded Azure Storage Credentials
AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
AZURE_CONTAINER_NAME = "recordings"

# Hardcoded Database Configuration
db_config = {
    "server": os.getenv("DB_SERVER"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_DATABASE"),
}


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Change this if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)

UPLOAD_DIR = "recordings"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def upload_to_azure(file_path: str, file_name: str) -> str:
    blob_client = blob_service_client.get_blob_client(container=AZURE_CONTAINER_NAME, blob=file_name)
    with open(file_path, "rb") as data:
        blob_client.upload_blob(data, overwrite=True)
    return f"https://{blob_service_client.account_name}.blob.core.windows.net/{AZURE_CONTAINER_NAME}/{file_name}"

def save_session_to_db(patient_name, therapist_name, session_date, blob_url):
    conn = pymssql.connect(**db_config)
    cursor = conn.cursor()
    query = """INSERT INTO dbo.Sessions (PatientID, TherapistID, SessionDate, BlobURL, Timestamp) VALUES (%s, %s, %s, %s, %s)"""
    cursor.execute(query, (1, 1, session_date, blob_url, datetime.now()))
    conn.commit()
    conn.close()

@app.post("/upload-audio/")
async def upload_audio(file: UploadFile = File(...), patient_name: str = Form(...), therapist_name: str = Form(...), session_date: str = Form(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    async with aiofiles.open(file_path, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)
    audio_url = upload_to_azure(file_path, file.filename)
    os.remove(file_path)
    save_session_to_db(patient_name, therapist_name, session_date, audio_url)
    return {"status": "uploaded", "url": audio_url}
    
    
if __name__ == "__main__":
    uvicorn.run("azure_functions:app", host="127.0.0.1", port=8000, reload=True)