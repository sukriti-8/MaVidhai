# Stage 1: builder
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build dependencies if needed (e.g., for psycopg2 or crypto libraries)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install pinned requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: runtime
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies (e.g., libpq for psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed python packages from builder
COPY --from=builder /install /usr/local

# Create non-root user
RUN useradd -m -s /bin/bash appuser && chown -R appuser:appuser /app

# Copy application artifacts
COPY app/ ./app/
COPY scripts/ ./scripts/
COPY alembic.ini .
COPY migrations/ ./migrations/

# Run as non-root user
USER appuser

# Start Uvicorn, responding normally to termination signals
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
