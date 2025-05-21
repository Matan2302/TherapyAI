FROM python:3.10

# Install system packages for pyodbc and SQL Server
RUN apt-get update && \
    apt-get install -y gcc g++ curl gnupg2 && \
    curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - && \
    curl https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list && \
    apt-get update && \
    ACCEPT_EULA=Y apt-get install -y msodbcsql18 && \
    apt-get install -y unixodbc-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

ENV PYTHONPATH=/app/src/Backend

RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]