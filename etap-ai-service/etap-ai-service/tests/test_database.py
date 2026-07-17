import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import _sanitize_database_url


def test_strips_prisma_schema_param():
    raw = "postgresql://postgres:admin123@localhost:5432/etap?schema=public"
    result = _sanitize_database_url(raw)
    assert "schema" not in result
    assert result == "postgresql://postgres:admin123@localhost:5432/etap"


def test_leaves_plain_url_unchanged():
    raw = "postgresql://postgres:admin123@localhost:5432/etap"
    assert _sanitize_database_url(raw) == raw


def test_preserves_other_query_params():
    raw = "postgresql://postgres:admin123@localhost:5432/etap?schema=public&sslmode=require"
    result = _sanitize_database_url(raw)
    assert "schema" not in result
    assert "sslmode=require" in result
