import os
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


def _sanitize_database_url(raw_url: str) -> str:
    """Strips Prisma-specific query params (e.g. ?schema=public) that
    psycopg2 doesn't understand — this lets the exact same DATABASE_URL
    value be reused from the NestJS backend's .env without the user having
    to maintain two slightly different connection strings."""
    parts = urlsplit(raw_url)
    query_pairs = [(k, v) for k, v in parse_qsl(parts.query) if k != "schema"]
    return urlunsplit(
        (parts.scheme, parts.netloc, parts.path, urlencode(query_pairs), parts.fragment)
    )


DATABASE_URL = _sanitize_database_url(
    os.environ.get(
        "DATABASE_URL",
        "postgresql://postgres:admin123@localhost:5432/etap",
    )
)

# pool_pre_ping avoids using a dead connection after the DB restarts; this
# service only ever reads (aggregation queries for forecasting) — it never
# writes to the tables NestJS owns.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_monthly_consumption(site_id: int | None, type_energie: str | None) -> list[dict]:
    """Aggregates quantite by month for a given site/energy type (or across
    everything if not specified), joining factures -> compteurs to reach
    siteId, since consumption quantities live on lignes_consommation but
    the site link goes through compteurs. Matches the Prisma schema's exact
    (quoted, camelCase) column names — Prisma never snake_cases individual
    fields, only table names via @@map."""
    query = text(
        """
        SELECT
            date_trunc('month', f."dateFacture") AS month,
            SUM(lc.quantite) AS total
        FROM factures f
        JOIN compteurs c ON c.id = f."compteurId"
        JOIN lignes_consommation lc ON lc."factureId" = f.id
        WHERE (:site_id IS NULL OR c."siteId" = :site_id)
          AND (:type_energie IS NULL OR f."typeEnergie" = :type_energie)
        GROUP BY month
        ORDER BY month
        """
    )
    with SessionLocal() as session:
        rows = session.execute(
            query, {"site_id": site_id, "type_energie": type_energie}
        ).fetchall()
    return [{"month": row.month, "total": float(row.total)} for row in rows]
