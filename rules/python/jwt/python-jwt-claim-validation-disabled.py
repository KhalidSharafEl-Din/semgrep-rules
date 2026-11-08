import jwt
from jose import jwt as jose_jwt

PUBLIC_KEY = open("public.pem").read()


def current_user(token: str):
    # ruleid: python-jwt-claim-validation-disabled
    return jwt.decode(token, PUBLIC_KEY, algorithms=["RS256"], options={"verify_exp": False})


def service_caller(token: str):
    # ruleid: python-jwt-claim-validation-disabled
    claims = jwt.decode(
        token,
        PUBLIC_KEY,
        algorithms=["RS256"],
        options={"verify_signature": True, "verify_aud": False},
    )
    return claims["sub"]


def tenant_from_token(token: str):
    # ruleid: python-jwt-claim-validation-disabled
    opts = {"verify_iss": False}
    return jwt.decode(token, PUBLIC_KEY, algorithms=["RS256"], options=opts)["tenant"]


def jose_user(token: str):
    # ruleid: python-jwt-claim-validation-disabled
    return jose_jwt.decode(token, PUBLIC_KEY, algorithms=["RS256"], options={"verify_exp": False})


def strict_user(token: str):
    # ok: python-jwt-claim-validation-disabled
    return jwt.decode(
        token,
        PUBLIC_KEY,
        algorithms=["RS256"],
        audience="orders-api",
        issuer="https://auth.example.com/",
        leeway=5,
    )


def require_claims(token: str):
    # ok: python-jwt-claim-validation-disabled
    return jwt.decode(
        token,
        PUBLIC_KEY,
        algorithms=["RS256"],
        options={"require": ["exp", "iss", "aud"], "verify_exp": True},
        audience="orders-api",
    )
