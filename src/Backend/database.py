# database.py

import urllib
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import DB_SERVER, DB_USER, DB_PASSWORD, DB_DATABASE

# 1. Build the raw ODBC connection string
raw_conn_str = (
    f"Driver={{ODBC Driver 18 for SQL Server}};"
    f"Server={DB_SERVER};"
    f"Database={DB_DATABASE};"
    f"Uid={DB_USER};"
    f"Pwd={DB_PASSWORD};"
    f"Encrypt=yes;"
    f"TrustServerCertificate=yes;"
    f"Connection Timeout=30;"
)

# 2. Encode the string for SQLAlchemy
params = urllib.parse.quote_plus(raw_conn_str)

# 3. Create the SQLAlchemy engine
engine = create_engine(f"mssql+pyodbc:///?odbc_connect={params}", echo=True)  # echo=True for debug

# 4. Create session and base
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
