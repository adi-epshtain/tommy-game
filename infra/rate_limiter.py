
from infra.logger import log
import time
from fastapi import HTTPException, Request

RATE_LIMIT = 20       # requests
WINDOW_SEC = 60       # per minute
RATE_LIMIT_MSG = "Too many requests"

async def rate_limit(request: Request, redis_client):
    ip = request.client.host
    key = f"rate_limit:{ip}"

    current = redis_client.incr(key)
    if current == 1:
        redis_client.expire(key, WINDOW_SEC)

    if current > RATE_LIMIT:
        log.warning(f"Login {RATE_LIMIT_MSG}")
        raise HTTPException(status_code=429, detail=RATE_LIMIT_MSG)
