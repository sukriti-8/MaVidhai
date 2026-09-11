import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


# When running tests, load only the test environment
if os.getenv("MAVIDHAI_TEST") == "1":
    test_env_path = os.path.join(os.path.dirname(__file__), "..", ".env.test")
    load_dotenv(test_env_path, override=True)
    DATABASE_URL = os.getenv("DATABASE_URL_TEST")
else:
    load_dotenv()
    DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Use a temporary SQLite database for tests when no URL is provided
    DATABASE_URL = "sqlite:///./test.db"


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

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
