# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /workspace

# Install dependencies first for Docker caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and scripts
COPY app/ ./app/
COPY scripts/ ./scripts/
COPY alembic.ini .
COPY migrations/ ./migrations/

# Expose port (Cloud Run sets PORT env var)
ENV PORT=10000
EXPOSE 10000

# Start FastAPI application using the PORT environment variable
# Cloud Run requires listening on 0.0.0.0 and the injected $PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
