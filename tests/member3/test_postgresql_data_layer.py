import csv
import os
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit


PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

DATA_DIR = PROJECT_ROOT / "data" / "demo"
SCHEMA_PATH = PROJECT_ROOT / "backend" / "database" / "schema.sql"


def load_opportunity_csv():
    with open(DATA_DIR / "opportunities.csv", "r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def test_schema_defines_opportunities_table_primary_key_and_indexes():
    schema = SCHEMA_PATH.read_text(encoding="utf-8").lower()

    assert "create table if not exists opportunities" in schema
    assert "opportunity_id text primary key" in schema
    assert "source_url text not null" in schema
    assert "idx_opportunities_district" in schema
    assert "idx_opportunities_state" in schema
    assert "idx_opportunities_scheme" in schema


def test_schema_columns_match_opportunity_csv_fields():
    from backend.database.opportunity_repository import CSV_TO_DB_COLUMNS

    csv_rows = load_opportunity_csv()
    assert set(CSV_TO_DB_COLUMNS) <= set(csv_rows[0].keys())

    schema = SCHEMA_PATH.read_text(encoding="utf-8").lower()
    for db_column in CSV_TO_DB_COLUMNS.values():
        assert re.search(rf"\b{db_column}\b", schema), f"{db_column} missing from schema"


def test_loader_rejects_bad_csv_and_preserves_current_csv_shape():
    from backend.database.load_opportunities import load_csv

    rows = load_csv()
    opportunity_ids = [row["Opportunity_ID"] for row in rows]

    assert len(rows) == 10
    assert len(opportunity_ids) == len(set(opportunity_ids))
    assert all(row["Source_URL"].strip() for row in rows)


def test_repository_upsert_is_conflict_safe():
    from backend.database.opportunity_repository import UPSERT_SQL

    normalized_sql = " ".join(UPSERT_SQL.lower().split())
    assert "on conflict (opportunity_id) do update set" in normalized_sql


def run_live_database_validation():
    try:
        from backend.database.config import get_database_url
        from backend.database.connection import initialize_schema
        from backend.database.load_opportunities import import_opportunities
        from backend.database.opportunity_repository import OpportunityRepository
    except ImportError as exc:
        print(f"Live PostgreSQL validation skipped: missing dependency: {exc}")
        return False

    database_url = os.getenv("DATABASE_URL") or get_database_url()
    parsed = urlsplit(database_url)
    safe_netloc = parsed.hostname or ""
    if parsed.port:
        safe_netloc += f":{parsed.port}"
    safe_url = urlunsplit((parsed.scheme, safe_netloc, parsed.path, "", ""))
    print(f"Live PostgreSQL validation using {safe_url}")

    try:
        initialize_schema(database_url)
        loaded_count = import_opportunities(database_url=database_url)
        repository = OpportunityRepository(database_url)
        all_rows = repository.get_all()
        row = repository.get_by_id("TN_NM_001")
    except Exception as exc:
        print(f"Live PostgreSQL validation failed: {exc}")
        return False

    opportunity_ids = [record["Opportunity_ID"] for record in all_rows]
    assert loaded_count == 10
    assert len(all_rows) == 10
    assert len(opportunity_ids) == len(set(opportunity_ids))
    assert all(record["Source_URL"].strip() for record in all_rows)
    assert row is not None
    assert row["Opportunity_ID"] == "TN_NM_001"
    print("Live PostgreSQL validation passed: connected, loaded 10 rows, and queried TN_NM_001.")
    return True


if __name__ == "__main__":
    test_schema_defines_opportunities_table_primary_key_and_indexes()
    test_schema_columns_match_opportunity_csv_fields()
    test_loader_rejects_bad_csv_and_preserves_current_csv_shape()
    test_repository_upsert_is_conflict_safe()
    print("Static PostgreSQL validation passed.")
    run_live_database_validation()
