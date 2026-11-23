from flask import Blueprint, request, jsonify, g
import jwt
import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from backend.config import Config
from backend.app.services.supabase_service import get_supabase_client, db_error_response
from backend.app.middleware.auth_middleware import token_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    client = get_supabase_client()
    if not client:
        return db_error_response("Database Connection Error: Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY in backend/.env to enable account registration.")

    data = request.get_json() or {}
    full_name = data.get('full_name', '').strip()
    campus_id = data.get('campus_id', '').strip().upper()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')
    department = data.get('department', '').strip()
    course = data.get('course', '').strip()
    semester = data.get('semester', '').strip()
    phone = data.get('phone', '').strip()

    if not all([full_name, campus_id, email, password]):
        return jsonify({'error': 'Full name, campus ID, email, and password are required.'}), 400

    if password != confirm_password:
        return jsonify({'error': 'Passwords do not match.'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must contain at least 6 characters.'}), 400

    try:
        # Check duplicate
        existing = client.table('profiles').select('id').or_(f"email.eq.{email},campus_id.eq.{campus_id}").execute()
        if existing.data and len(existing.data) > 0:
            return jsonify({'error': 'An account with this email or campus ID is already registered.'}), 409

        # Security: Force role to 'student' regardless of frontend payload
        hashed_pw = generate_password_hash(password)
        new_user = {
            'full_name': full_name,
            'campus_id': campus_id,
            'email': email,
            'phone': phone,
            'department': department or 'General',
            'course': course or 'Undergraduate',
            'semester': semester or '1st',
            'role': 'student',  # Enforced server-side
            'account_status': 'active',
            'password_hash': hashed_pw
        }
        res = client.table('profiles').insert(new_user).execute()
        if not res.data:
            return jsonify({'error': 'Failed to create user record in Supabase database.'}), 500

        created_profile = res.data[0]
        user_id = created_profile['id']

        token_payload = {
            'userId': user_id,
            'email': email,
            'role': 'student',
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=Config.JWT_EXPIRATION_HOURS)
        }
        token = jwt.encode(token_payload, Config.JWT_SECRET, algorithm='HS256')

        safe_user = dict(created_profile)
        safe_user.pop('password_hash', None)

        return jsonify({
            'message': 'Account registered successfully',
            'token': token,
            'user': safe_user
        }), 201
    except Exception as e:
        print(f"[Register Error]: {e}")
        return jsonify({'error': f'Database error during registration: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    client = get_supabase_client()
    if not client:
        return db_error_response("Database Connection Error: Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY in backend/.env to authenticate users.")

    data = request.get_json() or {}
    identifier = data.get('identifier', '').strip().lower()
    password = data.get('password', '')

    if not identifier or not password:
        return jsonify({'error': 'Campus ID/Email and password are required.'}), 400

    try:
        res = client.table('profiles').select('*').or_(f"email.ilike.{identifier},campus_id.ilike.{identifier}").execute()
        if not res.data or len(res.data) == 0:
            return jsonify({'error': 'Invalid credentials. Please verify your campus ID/email and password.'}), 401

        user_record = res.data[0]

        # Verify password
        pw_hash = user_record.get('password_hash')
        pw_valid = False
        if pw_hash:
            try:
                pw_valid = check_password_hash(pw_hash, password)
            except Exception:
                pw_valid = (password == pw_hash)
        else:
            # Fallback for initial seeded accounts (Admin@123 or Student@123)
            if user_record.get('role') == 'admin' and password == 'Admin@123':
                pw_valid = True
            elif password in ['Student@123', 'Password@123']:
                pw_valid = True

        if not pw_valid:
            return jsonify({'error': 'Invalid credentials. Please verify your campus ID/email and password.'}), 401

        if user_record.get('account_status') == 'suspended':
            return jsonify({'error': 'Your account has been suspended by campus administration. Please visit Central Security Desk.'}), 403

        token_payload = {
            'userId': user_record['id'],
            'email': user_record['email'],
            'role': user_record.get('role', 'student'),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=Config.JWT_EXPIRATION_HOURS)
        }
        token = jwt.encode(token_payload, Config.JWT_SECRET, algorithm='HS256')

        safe_user = dict(user_record)
        safe_user.pop('password_hash', None)

        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': safe_user
        }), 200
    except Exception as e:
        print(f"[Login Error]: {e}")
        return jsonify({'error': f'Database error during login: {str(e)}'}), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    user_payload = g.current_user
    client = get_supabase_client()
    if not client:
        return db_error_response()

    try:
        res = client.table('profiles').select('*').eq('id', user_payload['userId']).single().execute()
        if res.data:
            safe_user = dict(res.data)
            safe_user.pop('password_hash', None)
            return jsonify({'user': safe_user})
        return jsonify({'error': 'User profile not found in Supabase database.'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Logged out successfully'}), 200

