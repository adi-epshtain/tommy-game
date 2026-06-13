
from infra.logger import log
import time
from fastapi import HTTPException, Request
from typing import Optional
import redis

RATE_LIMIT = 20       # requests
WINDOW_SEC = 60       # per minute
RATE_LIMIT_MSG = "Too many requests"

async def rate_limit(request: Request, redis_client: Optional[redis.Redis] = None):
    ip = request.client.host
    key = f"rate_limit:{ip}"

    if not redis_client:
        log.warning("Redis not configured — skipping rate limiting.")
        return

    try:
        current = redis_client.incr(key)
        if current == 1:
            redis_client.expire(key, WINDOW_SEC)
        
        if current > RATE_LIMIT:
            log.warning(f"Rate limit exceeded for IP {ip}")
            raise HTTPException(status_code=429, detail=RATE_LIMIT_MSG)
        return
    except (redis.ConnectionError, redis.TimeoutError, AttributeError) as e:
        log.warning(f"Redis unavailable — skipping rate limiting: {e}")
        return
