
from flask import Blueprint, jsonify, g, current_app
from uuid import UUID

from backend.app.services.supabase_service import (
    get_supabase_client,
    db_error_response
)
from backend.app.middleware.auth_middleware import token_required


notification_bp = Blueprint(
    'notifications',
    __name__,
    url_prefix='/api/notifications'
)


def get_current_user_id():
    user = getattr(g, 'current_user', None)

    if not isinstance(user, dict):
        return None

    return (
        user.get('userId')
        or user.get('user_id')
        or user.get('id')
        or user.get('sub')
    )


def is_valid_uuid(value):
    if not value:
        return False

    try:
        UUID(str(value))
        return True
    except (ValueError, TypeError, AttributeError):
        return False


@notification_bp.route('', methods=['GET'])
@token_required
def get_user_notifications():
    user_id = get_current_user_id()

    if not user_id:
        return jsonify({
            'error': 'Authenticated user ID not found'
        }), 401

    # env-admin is a synthetic admin ID, not a database UUID.
    # Do not send it to the UUID-based notifications.user_id column.
    if not is_valid_uuid(user_id):
        return jsonify({
            'notifications': [],
            'unread_count': 0
        }), 200

    client = get_supabase_client()

    if not client:
        return db_error_response()

    try:
        response = (
            client.table('notifications')
            .select('*')
            .eq('user_id', str(UUID(str(user_id))))
            .order('created_at', desc=True)
            .execute()
        )

        notifications = response.data or []

        unread_count = sum(
            1 for item in notifications
            if not item.get('is_read', False)
        )

        return jsonify({
            'notifications': notifications,
            'unread_count': unread_count
        }), 200

    except Exception as e:
        current_app.logger.exception(
            'Failed to fetch notifications'
        )

        return jsonify({
            'error': 'Failed to fetch notifications',
            'details': str(e)
        }), 500


@notification_bp.route('/<notification_id>/read', methods=['PUT'])
@token_required
def mark_read(notification_id):
    user_id = get_current_user_id()

    if not user_id or not is_valid_uuid(user_id):
        return jsonify({
            'error': 'A valid database user ID is required'
        }), 400

    if not is_valid_uuid(notification_id):
        return jsonify({
            'error': 'Invalid notification ID'
        }), 400

    client = get_supabase_client()

    if not client:
        return db_error_response()

    try:
        response = (
            client.table('notifications')
            .update({'is_read': True})
            .eq('id', str(UUID(str(notification_id))))
            .eq('user_id', str(UUID(str(user_id))))
            .execute()
        )

        if not response.data:
            return jsonify({
                'error': 'Notification not found'
            }), 404

        return jsonify({
            'message': 'Marked notification as read'
        }), 200

    except Exception as e:
        current_app.logger.exception(
            'Failed to mark notification as read'
        )

        return jsonify({
            'error': 'Failed to mark notification as read',
            'details': str(e)
        }), 500


@notification_bp.route('/read-all', methods=['PUT'])
@token_required
def mark_all_read():
    user_id = get_current_user_id()

    if not user_id or not is_valid_uuid(user_id):
        return jsonify({
            'error': 'A valid database user ID is required'
        }), 400

    client = get_supabase_client()

    if not client:
        return db_error_response()

    try:
        response = (
            client.table('notifications')
            .update({'is_read': True})
            .eq('user_id', str(UUID(str(user_id))))
            .execute()
        )

        return jsonify({
            'message': 'All notifications marked as read',
            'updated_count': len(response.data or [])
        }), 200

    except Exception as e:
        current_app.logger.exception(
            'Failed to mark all notifications as read'
        )

        return jsonify({
            'error': 'Failed to mark all notifications as read',
            'details': str(e)
        }), 500
