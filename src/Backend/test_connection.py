from sqlalchemy import create_engine
from urllib.parse import quote_plus

# פרטי ההתחברות
user = "ptsd_admin"
password = quote_plus("P@ssword2024!")  # קידוד סיסמה עם תווים מיוחדים
server = "tcp:therapygroup05.database.windows.net,1433"
database = "TherapyGroup05"

# בניית מחרוזת ההתחברות
conn_str = (
    f"mssql+pyodbc://{user}:{password}@{server}:1433/{database}"
    "?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no"
)

# בדיקת התחברות
try:
    engine = create_engine(conn_str)
    with engine.connect() as connection:
        result = connection.execute("SELECT GETDATE()")
        print("✅ Connected! Current time from SQL:", list(result)[0][0])
except Exception as e:
    print("❌ Failed to connect to Azure SQL:")
    print(e)
