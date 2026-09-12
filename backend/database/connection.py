from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

import psycopg
from psycopg import Connection

try:
    from .config import get_database_url
except ImportError:
    from config import get_database_url


SCHEMA_PATH = Path(__file__).resolve().with_name("schema.sql")


@contextmanager
def get_connection(database_url: str | None = None) -> Iterator[Connection]:
    conn = psycopg.connect(database_url or get_database_url())
    try:
        yield conn
    finally:
        conn.close()


def initialize_schema(database_url: str | None = None) -> None:
    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
    with get_connection(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(schema_sql)
        conn.commit()
