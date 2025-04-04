FROM python:3.10

# Install system packages for pyodbc if needed
RUN apt-get update && \
    apt-get install -y gcc g++ unixodbc-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

CMD ["uvicorn", "src.Backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
