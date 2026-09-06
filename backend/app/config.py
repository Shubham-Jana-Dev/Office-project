import os
from dotenv import load_dotenv

# Load environment variables from .env located in backend/
backend_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
load_dotenv(os.path.join(backend_dir, '.env'))


def _build_database_url() -> str:
    """
    Build the SQLAlchemy database URL from individual DB_* variables.
    Falls back to DATABASE_URL if set, then to a local dev default.
    """
    # Prefer an explicitly set DATABASE_URL (e.g. set directly on Render)
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        return database_url

    # Compose from individual parts (matches Render env-var pattern)
    host = os.environ.get('DB_HOST', 'localhost')
    port = os.environ.get('DB_PORT', '3306')
    user = os.environ.get('DB_USER', 'root')
    password = os.environ.get('DB_PASSWORD', '')
    name = os.environ.get('DB_NAME', 'garment_erp')

    return f'mysql+pymysql://{user}:{password}@{host}:{port}/{name}?charset=utf8mb4'


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-session-secret-key')
    SQLALCHEMY_DATABASE_URI = _build_database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours in seconds
    JSON_SORT_KEYS = False
