
import os
from functools import wraps

import jwt

from flask import request, jsonify, g

from backend.config import Config
from backend.app.services.supabase_service import (
    get_supabase_client,
    db_error_response
)


def token_required(f):

    @wraps(f)
    def decorated(*args, **kwargs):

        # 1. Authorization header
        auth_header = request.headers.get('Authorization', '')
        parts = auth_header.split()

        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({
                'error': 'Authorization token is missing or invalid.'
            }), 401

        token = parts[1]

        # 2. Verify JWT signature and expiry
        try:
            payload = jwt.decode(
                token,
                Config.JWT_SECRET,
                algorithms=['HS256']
            )

        except jwt.ExpiredSignatureError:
            return jsonify({
                'error': 'Your login session has expired. Please log in again.'
            }), 401

        except jwt.InvalidTokenError:
            return jsonify({
                'error': 'Invalid authentication token.'
            }), 401

        user_id = payload.get('userId')

        if not user_id:
            return jsonify({
                'error': 'Invalid authentication token.'
            }), 401

        # 3. Verify environment-based admin token
        if payload.get('authSource') == 'env':

            admin_email = os.getenv(
                'ADMIN_EMAIL', ''
            ).strip().lower()

            admin_id = os.getenv(
                'ADMIN_ID', ''
            ).strip().upper()

            token_email = str(
                payload.get('email') or ''
            ).strip().lower()

            if (
                payload.get('role') != 'admin'
                or user_id != 'env-admin'
                or not admin_email
                or not admin_id
                or token_email != admin_email
            ):
                return jsonify({
                    'error': 'Invalid administrator session.'
                }), 401

            g.current_user = {
                'userId': 'env-admin',
                'email': admin_email,
                'full_name': 'Campus Administrator',
                'campus_id': admin_id,
                'role': 'admin',
                'account_status': 'active',
                'authSource': 'env'
            }

            return f(*args, **kwargs)

        # 4. Verify normal student account from Supabase
        client = get_supabase_client()

        if client is None:
            return db_error_response(
                'Database connection unavailable. '
                'Please check backend configuration.'
            )

        try:
            result = (
                client.table('profiles')
                .select(
                    'id, full_name, email, role, account_status, '
                    'campus_id, department'
                )
                .eq('id', user_id)
                .limit(1)
                .execute()
            )

            if not result.data:
                return jsonify({
                    'error': 'User account not found in database.'
                }), 401

            profile = result.data[0]

            if profile.get('account_status') != 'active':
                return jsonify({
                    'error': 'Access denied. Your account is not active.'
                }), 403

            # Reject an unexpected admin token from the student flow.
            if profile.get('role') == 'admin':
                return jsonify({
                    'error': 'Invalid administrator session.'
                }), 401

            g.current_user = {
                'userId': str(profile['id']),
                'email': profile['email'],
                'full_name': profile.get('full_name'),
                'campus_id': profile.get('campus_id'),
                'department': profile.get('department'),
                'role': profile.get('role', 'student'),
                'account_status': profile.get('account_status'),
                'authSource': 'supabase'
            }

        except Exception as error:
            print(f'[Authentication Database Error]: {error}')

            return db_error_response(
                'Unable to verify your account with the database.'
            )

        return f(*args, **kwargs)

    return decorated


# --------------------------------------------------
# ADMIN AUTHORIZATION
# --------------------------------------------------

def admin_required(f):

    @wraps(f)
    def decorated(*args, **kwargs):

        user = getattr(g, 'current_user', None)

        if not user:
            return jsonify({
                'error': 'Authentication required.'
            }), 401

        if user.get('account_status') != 'active':
            return jsonify({
                'error': 'Your account is not active.'
            }), 403

        if user.get('role') != 'admin':
            return jsonify({
                'error': 'Access denied. Administrator privileges required.'
            }), 403

        return f(*args, **kwargs)

    return decorated
