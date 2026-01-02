import redis
import os

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")  # Default to localhost for local dev
REDIS_PORT = os.getenv("REDIS_PORT", "6379")


redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    decode_responses=True
)
