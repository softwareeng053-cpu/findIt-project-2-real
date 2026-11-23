import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application Configuration for Findlt Flask Backend"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'findlt-super-secure-campus-jwt-key-2026')
    JWT_SECRET = os.getenv('JWT_SECRET', SECRET_KEY)
    JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', '168'))  # 7 days

    # Supabase Credentials
    SUPABASE_URL = os.getenv('SUPABASE_URL', '').strip()
    SUPABASE_KEY = os.getenv('SUPABASE_KEY', '').strip()  # Service role key or anon key
    SUPABASE_BUCKET_NAME = os.getenv('SUPABASE_BUCKET_NAME', 'lost-found-images').strip()

    # Security & CORS
    CORS_ORIGINS = [origin.strip() for origin in os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173').split(',') if origin.strip()]
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max payload

    @classmethod
    def is_supabase_configured(cls) -> bool:
        """Returns True if valid Supabase URL and Key are set."""
        url = cls.SUPABASE_URL
        key = cls.SUPABASE_KEY
        return bool(url and key and not url.startswith('YOUR_') and not key.startswith('YOUR_') and 'supabase.co' in url)

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

