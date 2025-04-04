from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# סיסמה עם תווים מיוחדים מקודדת (URL encoded):
encoded_password = "P%40ssword2024%21"

# כתובת URL לחיבור
SQLALCHEMY_DATABASE_URL = (
    f"mssql+pyodbc://ptsd_admin:{encoded_password}@therapygroup05.database.windows.net:1433/TherapyGroup05"
    "?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=yes"
)

engine = create_engine(SQLALCHEMY_DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
