from typing import Dict, List


CSV_TO_DB_COLUMNS = {
    "Opportunity_ID": "opportunity_id",
    "Scheme": "scheme",
    "Course_Name": "course_name",
    "Skill_Category": "skill_category",
    "Required_Skills": "required_skills",
    "District": "district",
    "State": "state",
    "Eligibility": "eligibility",
    "Duration": "duration",
    "Provider": "provider",
    "Type": "type",
    "Source_URL": "source_url",
}

DB_TO_CSV_COLUMNS = {db: csv for csv, db in CSV_TO_DB_COLUMNS.items()}


def _get_connection(database_url: str | None = None):
    try:
        from .connection import get_connection
    except ImportError:
        from connection import get_connection
    return get_connection(database_url)


UPSERT_SQL = """
INSERT INTO opportunities (
    opportunity_id,
    scheme,
    course_name,
    skill_category,
    required_skills,
    district,
    state,
    eligibility,
    duration,
    provider,
    type,
    source_url
) VALUES (
    %(opportunity_id)s,
    %(scheme)s,
    %(course_name)s,
    %(skill_category)s,
    %(required_skills)s,
    %(district)s,
    %(state)s,
    %(eligibility)s,
    %(duration)s,
    %(provider)s,
    %(type)s,
    %(source_url)s
)
ON CONFLICT (opportunity_id) DO UPDATE SET
    scheme = EXCLUDED.scheme,
    course_name = EXCLUDED.course_name,
    skill_category = EXCLUDED.skill_category,
    required_skills = EXCLUDED.required_skills,
    district = EXCLUDED.district,
    state = EXCLUDED.state,
    eligibility = EXCLUDED.eligibility,
    duration = EXCLUDED.duration,
    provider = EXCLUDED.provider,
    type = EXCLUDED.type,
    source_url = EXCLUDED.source_url;
"""


def csv_row_to_db(row: Dict[str, str]) -> Dict[str, str]:
    return {db_column: row[csv_column] for csv_column, db_column in CSV_TO_DB_COLUMNS.items()}


def db_row_to_csv(row: Dict[str, str]) -> Dict[str, str]:
    return {csv_column: row[db_column] for db_column, csv_column in DB_TO_CSV_COLUMNS.items()}


class OpportunityRepository:
    def __init__(self, database_url: str | None = None):
        self.database_url = database_url

    def upsert_many(self, opportunities: List[Dict[str, str]]) -> int:
        rows = [csv_row_to_db(row) for row in opportunities]
        with _get_connection(self.database_url) as conn:
            with conn.cursor() as cur:
                cur.executemany(UPSERT_SQL, rows)
            conn.commit()
        return len(rows)

    def get_all(self, district: str | None = None, state: str | None = None) -> List[Dict[str, str]]:
        import psycopg.rows

        sql = "SELECT * FROM opportunities"
        params = {}
        filters = []
        if district:
            filters.append("district = %(district)s")
            params["district"] = district
        if state:
            filters.append("state = %(state)s")
            params["state"] = state
        if filters:
            sql += " WHERE " + " AND ".join(filters)
        sql += " ORDER BY opportunity_id"

        with _get_connection(self.database_url) as conn:
            with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
                cur.execute(sql, params)
                return [db_row_to_csv(row) for row in cur.fetchall()]

    def get_by_id(self, opportunity_id: str) -> Dict[str, str] | None:
        import psycopg.rows

        with _get_connection(self.database_url) as conn:
            with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
                cur.execute(
                    "SELECT * FROM opportunities WHERE opportunity_id = %s",
                    (opportunity_id,),
                )
                row = cur.fetchone()
                return db_row_to_csv(row) if row else None

    def count(self) -> int:
        with _get_connection(self.database_url) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM opportunities")
                return cur.fetchone()[0]
