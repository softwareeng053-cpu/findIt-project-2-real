from flask import Blueprint, jsonify, g
from backend.app.services.supabase_service import get_supabase_client, db_error_response
from backend.app.middleware.auth_middleware import token_required

notification_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notification_bp.route('', methods=['GET'])
@token_required
def get_user_notifications():
    client = get_supabase_client()
    if not client:
        return db_error_response()

    user = g.current_user
    try:
        res = client.table('notifications').select('*').eq('user_id', user['userId']).order('created_at', desc=True).execute()
        unread_count = sum(1 for n in (res.data or []) if not n.get('is_read'))
        return jsonify({
            'notifications': res.data or [],
            'unread_count': unread_count
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notification_bp.route('/<notification_id>/read', methods=['PUT'])
@token_required
def mark_read(notification_id):
    client = get_supabase_client()
    if not client:
        return db_error_response()

    user = g.current_user
    try:
        client.table('notifications').update({'is_read': True}).eq('id', notification_id).eq('user_id', user['userId']).execute()
        return jsonify({'message': 'Marked notification as read'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notification_bp.route('/read-all', methods=['PUT'])
@token_required
def mark_all_read():
    client = get_supabase_client()
    if not client:
        return db_error_response()

    user = g.current_user
    try:
        client.table('notifications').update({'is_read': True}).eq('user_id', user['userId']).execute()
        return jsonify({'message': 'All notifications marked as read'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

