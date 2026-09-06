import os
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Load .env when running locally (no-op if the file doesn't exist, which is
# fine on Render where env vars are injected directly by the platform).
# ---------------------------------------------------------------------------
_backend_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
load_dotenv(os.path.join(_backend_dir, '.env'))


def _require(name: str) -> str:
    """Return the value of an environment variable or raise a clear error."""
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(
            f"Required environment variable '{name}' is not set. "
            f"Add it to your Render service's environment variables (or backend/.env for local dev)."
        )
    return value


def _build_database_url() -> str:
    """
    Return the SQLAlchemy database URL.

    Resolution order:
      1. DATABASE_URL — set this directly on Render for the simplest setup.
      2. Compose from individual DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME
         vars (also supported by Render).

    A missing database configuration raises RuntimeError immediately so the
    problem is visible in Render's deploy logs rather than surfacing as a
    cryptic 500 at request time.
    """
    # Option 1: explicit full URL
    url = os.environ.get('DATABASE_URL', '').strip()
    if url:
        return url

    # Option 2: individual DB_* vars — all are required when DATABASE_URL is absent
    host = os.environ.get('DB_HOST', '').strip()
    port = os.environ.get('DB_PORT', '').strip()
    user = os.environ.get('DB_USER', '').strip()
    password = os.environ.get('DB_PASSWORD', '').strip()
    name = os.environ.get('DB_NAME', '').strip()

    missing = [k for k, v in {
        'DB_HOST': host, 'DB_PORT': port,
        'DB_USER': user, 'DB_PASSWORD': password,
        'DB_NAME': name,
    }.items() if not v]

    if missing:
        raise RuntimeError(
            f"DATABASE_URL is not set and the following individual DB_* environment "
            f"variables are also missing: {', '.join(missing)}. "
            f"Set either DATABASE_URL or all five DB_* variables in your Render "
            f"service environment."
        )

    return f'mysql+pymysql://{user}:{password}@{host}:{port}/{name}'


class Config:
    # ------------------------------------------------------------------ #
    # Security                                                             #
    # ------------------------------------------------------------------ #
    SECRET_KEY = _require('SECRET_KEY')
    JWT_SECRET_KEY = _require('JWT_SECRET_KEY')

    # ------------------------------------------------------------------ #
    # Database                                                             #
    # ------------------------------------------------------------------ #
    SQLALCHEMY_DATABASE_URI = _build_database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # SSL for Aiven MySQL — passed via connect_args so PyMySQL receives a
    # proper dict, not an unsupported query-string parameter like ?ssl_mode=…
    # Setting ssl={"ssl_disabled": False} tells PyMySQL to negotiate TLS.
    # Aiven enforces TLS on all connections; this satisfies that requirement
    # without triggering TypeError from unsupported keyword arguments.
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {
            'ssl': {'ssl_disabled': False},
        },
        'pool_pre_ping': True,      # drop stale connections before use
        'pool_recycle': 280,        # recycle before Aiven's 5-min idle timeout
    }

    # ------------------------------------------------------------------ #
    # JWT                                                                  #
    # ------------------------------------------------------------------ #
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours in seconds

    # ------------------------------------------------------------------ #
    # Misc                                                                 #
    # ------------------------------------------------------------------ #
    JSON_SORT_KEYS = False
