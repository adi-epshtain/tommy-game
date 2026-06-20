from typing import Optional
from datetime import datetime, timedelta, timezone
import os

from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from starlette import status
from dotenv import load_dotenv

load_dotenv()

# Environment mode. Defaults to production so we fail safe (strict) unless
# explicitly told this is a dev environment. `.split("#")` guards against an
# accidental inline comment in the .env value (e.g. "production # ...").
APP_MODE = os.getenv("APP_MODE", "production").split("#")[0].strip().lower()
IS_PRODUCTION = APP_MODE == "production"

_DEV_FALLBACK_SECRET = "dev-insecure-secret-do-not-use-in-production"

# JWT signing key MUST come from the environment. Tokens are HS256-signed with
# this key, so anyone who knows it can forge an admin token. Never hardcode it.
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    if IS_PRODUCTION:
        raise RuntimeError(
            "JWT_SECRET_KEY environment variable is not set. "
            "Generate a strong random value (e.g. `python -c \"import secrets; "
            "print(secrets.token_urlsafe(64))\"`) and set it before starting in production."
        )
    # Dev-only fallback so local development works without setup.
    SECRET_KEY = _DEV_FALLBACK_SECRET

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

# Admin credentials from environment variables.
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
if IS_PRODUCTION and (not ADMIN_PASSWORD or ADMIN_PASSWORD.strip().lower() == "admin"):
    raise RuntimeError(
        "ADMIN_PASSWORD environment variable must be set to a non-default value in production. "
        "Refusing to start with a missing or default ('admin') admin password."
    )
if not ADMIN_PASSWORD:
    # Dev-only fallback.
    ADMIN_PASSWORD = "admin"


async def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


async def get_current_player(token: str = Depends(oauth2_scheme)) -> Optional[dict]:
    payload = await verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return payload


async def get_current_admin(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Verify admin token. Admin tokens have "role": "admin" in payload.
    """
    payload = await verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return payload
