import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Optional

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.JWTError:
        return None


def verify_telegram_auth(auth_data: dict, bot_token: str, max_age_seconds: int = 3600) -> bool:
    """
    Verify Telegram Login Widget authentication data.

    The data-check-string is a concatenation of all received fields,
    sorted in alphabetical order, in the format key=<value> with a line feed character
    ('\\n', 0x0A) used as separator.

    The secret key is SHA256(bot_token).
    The hash is HMAC-SHA-256(data_check_string, secret_key).

    Args:
        auth_data: Dictionary with Telegram auth data (id, first_name, auth_date, hash, etc.)
        bot_token: Telegram bot token
        max_age_seconds: Maximum age of auth_date in seconds (default 1 hour)

    Returns:
        True if authentication data is valid, False otherwise
    """
    received_hash = auth_data.get('hash')
    if not received_hash:
        return False

    # Check auth_date is not too old
    auth_date = auth_data.get('auth_date', 0)
    if datetime.utcnow().timestamp() - auth_date > max_age_seconds:
        return False

    # Build data-check-string (exclude hash, exclude None values)
    check_data = {k: v for k, v in auth_data.items() if k != 'hash' and v is not None}
    data_check_string = '\n'.join(
        f"{k}={v}" for k, v in sorted(check_data.items())
    )

    # Calculate secret key (SHA256 of bot token)
    secret_key = hashlib.sha256(bot_token.encode()).digest()

    # Calculate hash (HMAC-SHA256)
    calculated_hash = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(calculated_hash, received_hash)
