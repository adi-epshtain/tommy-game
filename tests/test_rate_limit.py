import os
import pytest
from fastapi.testclient import TestClient

# Configure DB env vars for tests (local run, not inside Docker)
os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_PORT", "5432")
os.environ.setdefault("DB_USER", "postgres")
os.environ.setdefault("DB_PASSWORD", "postgres")
os.environ.setdefault("DB_NAME", "tommy_game_db")
# Use local Redis as well (if running via Docker port mapping)
os.environ.setdefault("REDIS_HOST", "localhost")
os.environ.setdefault("REDIS_PORT", "6379")

from main import app
from infra.rate_limiter import RATE_LIMIT, RATE_LIMIT_MSG
from infra.redis_client import redis_client

client = TestClient(app)


def test_login_rate_limit_exceeded():
    redis_client.flushdb()  # reset state
    payload = {
        "username": "test_user",
        "password": "wrong_password",
    }

    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }

    # X attempts 
    for _ in range(RATE_LIMIT):
        res = client.post("/login", data=payload, headers=headers)
        assert res.status_code in (401, 404, 200)

    # after X attempt – rate limited
    res = client.post("/login", data=payload, headers=headers)
    assert res.status_code == 429
    assert res.json()["detail"] == RATE_LIMIT_MSG
