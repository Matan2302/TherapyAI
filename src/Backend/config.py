import os
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

# Azure SQL DB
AZURE_SQL_CONNECTION_STRING = os.getenv("AZURE_SQL_CONNECTION_STRING")
DB_SERVER = os.getenv("DB_SERVER")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_DATABASE = os.getenv("DB_DATABASE")

# Azure Blob Storage
AZURE_BLOB_CONN_STRING = os.getenv("AZURE_BLOB_CONN_STRING")
AZURE_BLOB_CONTAINER_NAME = os.getenv("AZURE_BLOB_CONTAINER_NAME", "recordings")
BLOB_SERVER_NAME = os.getenv("BLOB_SERVER")
BLOB_USER = os.getenv("BLOB_USER")
BLOB_PASSWORD = os.getenv("BLOB_PASSWORD")
BLOB_DATABASE = os.getenv("BLOB_DATABASE")

# TODO: Azure Speech-to-Text config add
#AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
#AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION")

# CORS - allow frontend to connect
FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",")

#Secret key as the user wont needed to show user name and password in every page
SECRET_KEY = "my_super_secret_therapist_app_key"
