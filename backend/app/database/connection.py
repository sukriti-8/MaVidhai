import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from .base import Base


import pathlib
# Load test environment if .env.test exists
test_env_path = pathlib.Path(__file__).resolve().parents[2] / ".env.test"
if test_env_path.is_file():
    load_dotenv(test_env_path, override=True)
# Load regular environment variables
load_dotenv()
# Prefer test DB URL if set, else regular DB URL
DATABASE_URL = os.getenv("DATABASE_URL_TEST") or os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Use a temporary SQLite database for tests when no URL is provided
    DATABASE_URL = "sqlite:///./test.db"


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

# Enable foreign key enforcement for SQLite connections.
# Without this, ON DELETE CASCADE / SET NULL constraints are silently ignored.
if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
