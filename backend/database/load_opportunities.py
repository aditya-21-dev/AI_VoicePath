import csv
from pathlib import Path

try:
    from .opportunity_repository import CSV_TO_DB_COLUMNS, OpportunityRepository
except ImportError:
    from opportunity_repository import CSV_TO_DB_COLUMNS, OpportunityRepository


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CSV_PATH = PROJECT_ROOT / "data" / "demo" / "opportunities.csv"


def load_csv(path: Path = DEFAULT_CSV_PATH) -> list[dict[str, str]]:
    with open(path, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        missing_columns = set(CSV_TO_DB_COLUMNS) - set(reader.fieldnames or [])
        if missing_columns:
            raise ValueError(f"Missing required CSV columns: {sorted(missing_columns)}")
        rows = list(reader)

    for row in rows:
        missing_values = [column for column in CSV_TO_DB_COLUMNS if not row[column].strip()]
        if missing_values:
            raise ValueError(f"{row.get('Opportunity_ID', '<unknown>')} has blank fields: {missing_values}")

    opportunity_ids = [row["Opportunity_ID"] for row in rows]
    duplicate_ids = sorted({oid for oid in opportunity_ids if opportunity_ids.count(oid) > 1})
    if duplicate_ids:
        raise ValueError(f"Duplicate Opportunity_ID values in CSV: {duplicate_ids}")

    return rows


def import_opportunities(csv_path: Path = DEFAULT_CSV_PATH, database_url: str | None = None) -> int:
    try:
        from .connection import initialize_schema
    except ImportError:
        from connection import initialize_schema

    opportunities = load_csv(csv_path)
    initialize_schema(database_url)
    repository = OpportunityRepository(database_url)
    return repository.upsert_many(opportunities)


def main() -> None:
    loaded_count = import_opportunities()
    repository = OpportunityRepository()
    total_count = repository.count()
    print(f"Loaded {loaded_count} opportunities from {DEFAULT_CSV_PATH}")
    print(f"Database now contains {total_count} opportunities")


if __name__ == "__main__":
    main()
