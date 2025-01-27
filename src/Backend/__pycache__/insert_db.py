from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware  # ✅ Import CORS
from pydantic import BaseModel
import pymssql
import uvicorn
from dotenv import load_dotenv
import os

load_dotenv()

db_config = {
    "server": os.getenv("DB_SERVER"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_DATABASE"),
}


# Initialize FastAPI app
app = FastAPI()

# ✅ Enable CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins, you can specify ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allow all headers
)



# Define Pydantic model for input validation
class Therapist(BaseModel):
    full_name: str
    specialization: str = None  # Specialization can be null
    contact_info: str = None  # Contact info can be null

# Dependency to get a database connection
def get_db_connection():
    try:
        conn = pymssql.connect(
            server=db_config["server"],
            user=db_config["user"],
            password=db_config["password"],
            database=db_config["database"]
        )
        return conn
    except pymssql.Error as e:
        raise HTTPException(status_code=500, detail=f"Database connection error: {e}")

# ✅ Corrected POST route
@app.post("/insert_therapist/")
async def add_therapist(therapist: Therapist):
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        query = """
        INSERT INTO Therapists (FullName, Specialization, ContactInfo)
        VALUES (%s, %s, %s);
        """
        cursor.execute(query, (therapist.full_name, therapist.specialization, therapist.contact_info))
        connection.commit()
        return {"message": "Therapist registered successfully", "therapist": therapist}

    except pymssql.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    finally:
        connection.close()

# ✅ Start FastAPI when running the script
if __name__ == "__main__":
    uvicorn.run("insert_db:app", host="127.0.0.1", port=8000, reload=True)