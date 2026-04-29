from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from .config import get_settings
from .models import Base


def build_engine(database_url: str | None = None):
    settings = get_settings()
    url = database_url or settings.sqlalchemy_database_url
    return create_engine(url, pool_pre_ping=True)


ENGINE = build_engine()
SessionLocal = sessionmaker(bind=ENGINE, autoflush=False, autocommit=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def initialize_database(engine=ENGINE) -> None:
    Base.metadata.create_all(bind=engine)
