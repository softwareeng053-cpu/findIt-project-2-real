import os
import uuid
import base64
from flask import jsonify
from supabase import create_client, Client
from backend.config import Config

supabase_client: Client = None

def get_supabase_client() -> Client:
    """
    Initializes and returns the singleton Supabase client.
    Returns None if credentials are missing or invalid.
    """
    global supabase_client
    if supabase_client is not None:
        return supabase_client

    if not Config.is_supabase_configured():
        return None

    url = Config.SUPABASE_URL
    key = Config.SUPABASE_KEY

    try:
        supabase_client = create_client(url, key)
        return supabase_client
    except Exception as e:
        print(f"[Supabase Init Error]: Failed to create client: {e}")
        return None

def db_error_response(message: str = None):
    """
    Returns standard 503 response when Supabase is not configured or unreachable.
    Prevents silent fallback to in-memory/dummy data.
    """
    detail = message or "Supabase PostgreSQL credentials are not configured or connection failed. Please set SUPABASE_URL and SUPABASE_KEY in your environment/backend .env file."
    return jsonify({
        'error': detail,
        'code': 'DATABASE_NOT_CONFIGURED',
        'status': 503,
        'solution': 'Set valid SUPABASE_URL and SUPABASE_KEY in backend/.env to connect to your PostgreSQL database.'
    }), 503

def require_supabase():
    """
    Helper for routes to check database connection.
    Returns (client, None) if available, or (None, response) with 503 error.
    """
    client = get_supabase_client()
    if not client:
        return None, db_error_response()
    return client, None

def upload_image_to_storage(file_bytes: bytes, filename: str, content_type: str = 'image/jpeg') -> str:
    """
    Uploads an image file to Supabase Storage bucket and returns public URL.
    """
    client = get_supabase_client()
    if not client:
        return ""

    bucket = Config.SUPABASE_BUCKET_NAME
    # Unique name to avoid conflicts
    unique_filename = f"{uuid.uuid4().hex}_{filename}"

    try:
        client.storage.from_(bucket).upload(
            path=unique_filename,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "true"}
        )
        public_url = client.storage.from_(bucket).get_public_url(unique_filename)
        return public_url
    except Exception as e:
        print(f"[Supabase Storage Upload Error]: {e}")
        return ""

def upload_base64_to_storage(base64_str: str) -> str:
    """
    Parses a data URL (data:image/png;base64,...), decodes bytes,
    and uploads to Supabase Storage. Returns public URL if successful.
    """
    if not base64_str or not base64_str.startswith('data:image'):
        return base64_str or ""

    try:
        header, encoded = base64_str.split(',', 1)
        mime_type = 'image/jpeg'
        ext = 'jpg'
        if 'image/png' in header:
            mime_type = 'image/png'
            ext = 'png'
        elif 'image/webp' in header:
            mime_type = 'image/webp'
            ext = 'webp'

        file_bytes = base64.b64decode(encoded)
        filename = f"upload_{uuid.uuid4().hex[:8]}.{ext}"
        public_url = upload_image_to_storage(file_bytes, filename, content_type=mime_type)
        return public_url if public_url else base64_str
    except Exception as e:
        print(f"[Base64 Storage Parse Error]: {e}")
        return base64_str

