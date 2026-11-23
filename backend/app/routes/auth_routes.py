
import os
import hmac
import jwt
import datetime

from flask import Blueprint, request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash

from backend.config import Config
from backend.app.services.supabase_service import (
    get_supabase_client,
    db_error_response
)
from backend.app.middleware.auth_middleware import token_required


auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


# --------------------------------------------------
# ADMIN ENVIRONMENT CREDENTIALS
# --------------------------------------------------

def get_admin_credentials():
    return {
        'email': os.getenv('ADMIN_EMAIL', '').strip().lower(),
        'admin_id': os.getenv('ADMIN_ID', '').strip().upper(),
        'password': os.getenv('ADMIN_PASSWORD', '')
    }


def is_admin_login(identifier, password):
    admin = get_admin_credentials()

    if not admin['password'] or not password:
        return False

    identifier = identifier.strip()

    email_match = (
        bool(admin['email'])
        and hmac.compare_digest(
            identifier.lower(),
            admin['email']
        )
    )

    id_match = (
        bool(admin['admin_id'])
        and hmac.compare_digest(
            identifier.upper(),
            admin['admin_id']
        )
    )

    password_match = hmac.compare_digest(
        password,
        admin['password']
    )

    return (email_match or id_match) and password_match


# --------------------------------------------------
# JWT HELPERS
# --------------------------------------------------

def create_auth_token(user, auth_source='supabase'):
    now = datetime.datetime.now(datetime.timezone.utc)

    token_payload = {
        'userId': str(user['id']),
        'email': user['email'],
        'role': user.get('role', 'student'),
        'authSource': auth_source,
        'iat': now,
        'exp': now + datetime.timedelta(
            hours=Config.JWT_EXPIRATION_HOURS
        )
    }

    return jwt.encode(
        token_payload,
        Config.JWT_SECRET,
        algorithm='HS256'
    )


def get_safe_user(user_record):
    safe_user = dict(user_record)
    safe_user.pop('password_hash', None)
    safe_user.pop('password', None)
    return safe_user


def get_request_data():
    return request.get_json(silent=True) or {}


# --------------------------------------------------
# REGISTER STUDENT
# --------------------------------------------------

@auth_bp.route('/register', methods=['POST'])
def register():

    data = get_request_data()

    full_name = str(data.get('full_name') or '').strip()
    campus_id = str(data.get('campus_id') or '').strip().upper()
    email = str(data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    confirm_password = data.get('confirm_password') or ''

    department = str(data.get('department') or '').strip()
    course = str(data.get('course') or '').strip()
    semester = str(data.get('semester') or '').strip()
    phone = str(data.get('phone') or '').strip()

    if not all([full_name, campus_id, email, password]):
        return jsonify({
            'error': 'Full name, campus ID, email and password are required.'
        }), 400

    if not isinstance(password, str):
        return jsonify({'error': 'Invalid password format.'}), 400

    if password != confirm_password:
        return jsonify({'error': 'Passwords do not match.'}), 400

    if len(password) < 6:
        return jsonify({
            'error': 'Password must contain at least 6 characters.'
        }), 400

    if len(email) > 254 or '@' not in email:
        return jsonify({'error': 'Please enter a valid email address.'}), 400

    client = get_supabase_client()

    if client is None:
        return db_error_response(
            'Supabase connection is unavailable. '
            'Please check backend/.env configuration.'
        )

    try:
        email_check = (
            client.table('profiles')
            .select('id')
            .eq('email', email)
            .limit(1)
            .execute()
        )

        if email_check.data:
            return jsonify({
                'error': 'This email is already registered.'
            }), 409

        campus_check = (
            client.table('profiles')
            .select('id')
            .eq('campus_id', campus_id)
            .limit(1)
            .execute()
        )

        if campus_check.data:
            return jsonify({
                'error': 'This campus ID is already registered.'
            }), 409

        new_user = {
            'full_name': full_name,
            'campus_id': campus_id,
            'email': email,
            'phone': phone,
            'department': department or 'General',
            'course': course or 'Undergraduate',
            'semester': semester or '1st',
            'role': 'student',
            'account_status': 'active',
            'password_hash': generate_password_hash(password)
        }

        result = (
            client.table('profiles')
            .insert(new_user)
            .execute()
        )

        if not result.data:
            return jsonify({
                'error': 'User registration failed.'
            }), 500

        created_profile = result.data[0]
        token = create_auth_token(created_profile)

        return jsonify({
            'message': 'Account registered successfully.',
            'token': token,
            'user': get_safe_user(created_profile)
        }), 201

    except Exception as error:
        print(f'[Register Error]: {error}')
        return jsonify({
            'error': 'Registration failed due to a database error.'
        }), 500


# --------------------------------------------------
# LOGIN: ADMIN FROM ENV, STUDENT FROM SUPABASE
# --------------------------------------------------

@auth_bp.route('/login', methods=['POST'])
def login():

    data = get_request_data()

    identifier = str(data.get('identifier') or '').strip()
    password = data.get('password') or ''

    if not identifier or not password:
        return jsonify({
            'error': 'Email/Campus ID and password are required.'
        }), 400

    if not isinstance(password, str):
        return jsonify({'error': 'Invalid password format.'}), 400

    # ----------------------------------------------
    # 1. ADMIN LOGIN FROM BACKEND .env
    # ----------------------------------------------

    if is_admin_login(identifier, password):

        admin = get_admin_credentials()

        admin_user = {
            'id': 'env-admin',
            'full_name': 'Campus Administrator',
            'email': admin['email'],
            'campus_id': admin['admin_id'],
            'role': 'admin',
            'account_status': 'active'
        }

        token = create_auth_token(
            admin_user,
            auth_source='env'
        )

        return jsonify({
            'message': 'Admin login successful.',
            'token': token,
            'user': admin_user
        }), 200

    # ----------------------------------------------
    # 2. STUDENT LOGIN FROM SUPABASE
    # ----------------------------------------------

    client = get_supabase_client()

    if client is None:
        return db_error_response(
            'Supabase connection is unavailable. '
            'Please check backend/.env configuration.'
        )

    try:
        if '@' in identifier:
            result = (
                client.table('profiles')
                .select('*')
                .eq('email', identifier.lower())
                .limit(1)
                .execute()
            )
        else:
            result = (
                client.table('profiles')
                .select('*')
                .eq('campus_id', identifier.upper())
                .limit(1)
                .execute()
            )

        if not result.data:
            return jsonify({
                'error': 'Invalid email/Campus ID or password.'
            }), 401

        user_record = result.data[0]

        if user_record.get('role') == 'admin':
            return jsonify({
                'error': 'Admin credentials are invalid.'
            }), 401

        password_hash = user_record.get('password_hash')

        if not password_hash:
            return jsonify({
                'error': 'Password is not configured for this account.'
            }), 401

        try:
            password_valid = check_password_hash(
                password_hash,
                password
            )
        except (ValueError, TypeError):
            password_valid = False

        if not password_valid:
            return jsonify({
                'error': 'Invalid email/Campus ID or password.'
            }), 401

        if user_record.get('account_status') != 'active':
            return jsonify({
                'error': 'Your account is not active. '
                         'Please contact campus administration.'
            }), 403

        token = create_auth_token(user_record)

        return jsonify({
            'message': 'Login successful.',
            'token': token,
            'user': get_safe_user(user_record)
        }), 200

    except Exception as error:
        print(f'[Login Error]: {error}')
        return jsonify({
            'error': 'Login failed due to a database error.'
        }), 500


# --------------------------------------------------
# GET CURRENT USER
# --------------------------------------------------

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():

    user_payload = g.current_user

    # Admin account is authenticated from backend .env.
    # It does not need a profiles table entry.

    if user_payload.get('authSource') == 'env':
        return jsonify({
            'user': {
                'id': user_payload['userId'],
                'full_name': 'Campus Administrator',
                'email': user_payload['email'],
                'campus_id': user_payload.get('campus_id'),
                'role': 'admin',
                'account_status': 'active'
            }
        }), 200

    client = get_supabase_client()

    if client is None:
        return db_error_response()

    try:
        user_id = user_payload.get('userId')

        result = (
            client.table('profiles')
            .select('*')
            .eq('id', user_id)
            .limit(1)
            .execute()
        )

        if not result.data:
            return jsonify({
                'error': 'User profile not found.'
            }), 404

        user_record = result.data[0]

        if user_record.get('account_status') != 'active':
            return jsonify({
                'error': 'Your account is not active.'
            }), 403

        return jsonify({
            'user': get_safe_user(user_record)
        }), 200

    except Exception as error:
        print(f'[Get Current User Error]: {error}')
        return jsonify({
            'error': 'Unable to retrieve user profile.'
        }), 500


# --------------------------------------------------
# LOGOUT
# --------------------------------------------------

@auth_bp.route('/logout', methods=['POST'])
def logout():

    return jsonify({
        'message': 'Logged out successfully.'
    }), 200
