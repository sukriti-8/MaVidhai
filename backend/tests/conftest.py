import os
import pytest
from pathlib import Path

# Ensure test database file is removed before creating tables
TEST_DB_PATH = Path(__file__).resolve().parent.parent / "test.db"

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Remove existing test DB if present
    if TEST_DB_PATH.is_file():
        TEST_DB_PATH.unlink()
    # Import after potential removal to get fresh engine
    from app.database.connection import engine, Base
    # Create all tables
    Base.metadata.create_all(bind=engine)
    # Seed initial data for tests
    import sys, os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'scripts')))
    from seed import seed_database

    seed_database()
    yield
    # Drop tables after tests
    Base.metadata.drop_all(bind=engine)
    # Dispose engine to release all connections (required on Windows
    # where SQLite file handles block deletion)
    engine.dispose()
    # Clean up test DB file
    if TEST_DB_PATH.is_file():
        TEST_DB_PATH.unlink()

