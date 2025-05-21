# docker/backend.Dockerfile
FROM python:3.11

WORKDIR /app

RUN apt-get update && \
    apt-get install -y gcc g++ freetds-dev python3-dev curl gnupg2 && \
    # Remove conflicting ODBC packages
    apt-get remove -y libodbc2 libodbcinst2 unixodbc-common || true && \
    rm -rf /var/lib/apt/lists/* && \
    curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - && \
    curl https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list && \
    apt-get update && \
    ACCEPT_EULA=Y apt-get install -y msodbcsql18 unixodbc unixodbc-dev && \
    rm -rf /var/lib/apt/lists/*

COPY src/Backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY src/Backend/ .     