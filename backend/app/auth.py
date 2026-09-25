import os
import jwt

from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from fastapi import HTTPException, Header

pwd = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

SECRET = os.getenv(
    "JWT_SECRET",
    "change-this-secret"
)


def hash_pw(password):
    return pwd.hash(password)


def verify(password, hashed_password):
    return pwd.verify(
        password,
        hashed_password
    )


def token(uid, email):

    payload = {
        "sub": str(uid),
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
    }

    return jwt.encode(
        payload,
        SECRET,
        algorithm="HS256"
    )


def current_user(
    authorization: str | None = Header(default=None)
):

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Login required"
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Login required"
        )

    try:

        access_token = authorization.split()[1]

        data = jwt.decode(
            access_token,
            SECRET,
            algorithms=["HS256"]
        )

        return {
            "id": int(data["sub"]),
            "email": data["email"]
        }

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )