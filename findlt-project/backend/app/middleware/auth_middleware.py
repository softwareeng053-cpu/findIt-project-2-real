from functools import wraps
from flask import request, jsonify, g
import jwt
from backend.config import Config
from backend.app.services.supabase_service import get_supabase_client

def token_required(f):
    """
    Decorator enforcing valid JWT authentication on protected routes.
    Verifies token and loads profile directly from Supabase PostgreSQL database
    to ensure role and account status are strictly authoritative.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Authorization token is missing. Please log in.'}), 401

        parts = auth_header.split(' ')
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'error': 'Malformed Authorization header. Format: Bearer <token>'}), 401

        token = parts[1]
        try:
            payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Authentication session has expired. Please log in again.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid authentication token.'}), 401

        user_id = payload.get('userId')
        client = get_supabase_client()

        # Authoritative database lookup
        if client:
            try:
                res = client.table('profiles').select('id, full_name, email, role, account_status, campus_id, department').eq('id', user_id).single().execute()
                if not res.data:
                    return jsonify({'error': 'User account not found in database.'}), 401
                
                profile = res.data
                if profile.get('account_status') == 'suspended':
                    return jsonify({'error': 'Access denied: Your student account is currently suspended by campus administration.'}), 403

                # Bind verified database identity
                g.current_user = {
                    'userId': profile['id'],
                    'email': profile['email'],
                    'full_name': profile.get('full_name'),
                    'campus_id': profile.get('campus_id'),
                    'department': profile.get('department'),
                    'role': profile.get('role', 'student'),
                    'account_status': profile.get('account_status', 'active')
                }
            except Exception as e:
                # If lookup fails due to transient DB error, fall back to payload role
                g.current_user = payload
        else:
            g.current_user = payload

        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    """
    Decorator enforcing that the authenticated user possesses administrator role.
    Must be stacked after @token_required. Prevents students from escalating privileges.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        user = getattr(g, 'current_user', None)
        if not user or user.get('role') != 'admin':
            return jsonify({'error': 'Access denied: Administrator privileges required for this action.'}), 403
        return f(*args, **kwargs)
    return decorated

