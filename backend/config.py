
import os
from pathlib import Path
from dotenv import load_dotenv


# Get the directory where this config.py file is located
BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from backend/.env
load_dotenv(dotenv_path=BASE_DIR / ".env", override=False)


class Config:
    """Application Configuration for Findlt Flask Backend"""

    # Application Security
    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "findlt-super-secure-campus-jwt-key-2026"
    )

    JWT_SECRET = os.getenv("JWT_SECRET", SECRET_KEY)

    JWT_EXPIRATION_HOURS = int(
        os.getenv("JWT_EXPIRATION_HOURS", "168")
    )

    # Supabase Credentials
    SUPABASE_URL = os.getenv(
        "SUPABASE_URL", ""
    ).strip()

    SUPABASE_KEY = os.getenv(
        "SUPABASE_KEY", ""
    ).strip()

    SUPABASE_BUCKET_NAME = os.getenv(
        "SUPABASE_BUCKET_NAME", "lost-found-images"
    ).strip()

    # Security & CORS
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            (
                "http://localhost:3000,"
                "http://localhost:5173,"
                "http://127.0.0.1:3000,"
                "http://127.0.0.1:5173"
            )
        ).split(",")
        if origin.strip()
    ]

    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB

    @classmethod
    def is_supabase_configured(cls) -> bool:
        """Check whether Supabase URL and key are configured."""

        url = cls.SUPABASE_URL
        key = cls.SUPABASE_KEY

        return bool(
            url
            and key
            and url.startswith("https://")
            and "supabase.co" in url
            and not url.startswith("YOUR_")
            and not key.startswith("YOUR_")
        )


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
