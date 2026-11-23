
import base64
import binascii
import uuid
from pathlib import Path
from typing import Optional

from flask import jsonify
from supabase import create_client, Client

from backend.config import Config


# Supabase client singleton
supabase_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    """
    Initialize and return the Supabase client.
    Returns None if credentials are missing or initialization fails.
    """
    global supabase_client

    if supabase_client is not None:
        return supabase_client

    if not Config.is_supabase_configured():
        print("[Supabase] Configuration missing or invalid.")
        return None

    try:
        supabase_client = create_client(
            Config.SUPABASE_URL,
            Config.SUPABASE_KEY
        )

        print("[Supabase] Client initialized successfully.")
        return supabase_client

    except Exception as error:
        print(f"[Supabase Init Error]: {error}")
        supabase_client = None
        return None


def db_error_response(message: Optional[str] = None):
    """
    Return a standard database-unavailable response.
    """
    detail = message or (
        "Supabase is not configured or the database is unavailable. "
        "Please check SUPABASE_URL and SUPABASE_KEY in backend/.env."
    )

    return jsonify({
        "error": detail,
        "code": "DATABASE_NOT_CONFIGURED",
        "status": 503,
        "solution": (
            "Check valid SUPABASE_URL and SUPABASE_KEY "
            "in backend/.env and restart the Flask server."
        )
    }), 503


def require_supabase():
    """
    Return (client, None) when available.
    Otherwise return (None, 503 response).
    """
    client = get_supabase_client()

    if client is None:
        return None, db_error_response()

    return client, None


def upload_image_to_storage(
    file_bytes: bytes,
    filename: str,
    content_type: str = "image/jpeg"
) -> str:
    """
    Upload image bytes to Supabase Storage.
    Returns the public URL on success, otherwise an empty string.
    """
    client = get_supabase_client()

    if client is None:
        print("[Storage Error] Supabase client is unavailable.")
        return ""

    if not file_bytes:
        print("[Storage Error] Empty image file.")
        return ""

    bucket = Config.SUPABASE_BUCKET_NAME

    # Keep only the filename, not any supplied directory path.
    safe_filename = Path(filename).name
    unique_filename = f"{uuid.uuid4().hex}_{safe_filename}"

    try:
        client.storage.from_(bucket).upload(
            path=unique_filename,
            file=file_bytes,
            file_options={
                "content-type": content_type,
                "upsert": "false"
            }
        )

        public_url = client.storage.from_(bucket).get_public_url(
            unique_filename
        )

        if isinstance(public_url, str):
            return public_url

        if hasattr(public_url, "get"):
            return (
                public_url.get("publicUrl")
                or public_url.get("public_url")
                or ""
            )

        return ""

    except Exception as error:
        print(f"[Supabase Storage Upload Error]: {error}")
        return ""


def upload_base64_to_storage(base64_str: str) -> str:
    """
    Decode a base64 image data URL and upload it to Supabase Storage.
    Returns the public URL on success, otherwise an empty string.
    """
    if not base64_str:
        return ""

    if not base64_str.startswith("data:image/"):
        return base64_str

    try:
        header, encoded = base64_str.split(",", 1)

        if ";base64" not in header:
            print("[Base64 Error] Image data is not base64 encoded.")
            return ""

        mime_type = header.split(":", 1)[1].split(";", 1)[0].lower()

        allowed_types = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp"
        }

        if mime_type not in allowed_types:
            print(f"[Base64 Error] Unsupported image type: {mime_type}")
            return ""

        file_bytes = base64.b64decode(encoded, validate=True)

        if not file_bytes:
            return ""

        extension = allowed_types[mime_type]
        filename = f"upload_{uuid.uuid4().hex}.{extension}"

        public_url = upload_image_to_storage(
            file_bytes=file_bytes,
            filename=filename,
            content_type=mime_type
        )

        return public_url

    except (ValueError, binascii.Error) as error:
        print(f"[Base64 Parse Error]: {error}")
        return ""

    except Exception as error:
        print(f"[Base64 Upload Error]: {error}")
        return ""
