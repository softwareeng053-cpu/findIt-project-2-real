from flask import Blueprint, jsonify, g
from backend.app.services.supabase_service import get_supabase_client, db_error_response
from backend.app.middleware.auth_middleware import token_required

public_bp = Blueprint('public', __name__, url_prefix='/api')

@public_bp.route('/stats/public', methods=['GET'])
def get_public_stats():
    """Returns live campus stats aggregated directly from Supabase database."""
    client = get_supabase_client()
    if not client:
        return db_error_response("Database Connection Error: Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY in backend/.env.")

    try:
        total_items = client.table('items').select('id', count='exact').execute()
        returned = client.table('items').select('id', count='exact').eq('status', 'returned').execute()
        active = client.table('items').select('id', count='exact').in_('status', ['open', 'claimed']).execute()
        found = client.table('items').select('id', count='exact').eq('item_type', 'found').execute()
        lost = client.table('items').select('id', count='exact').eq('item_type', 'lost').execute()

        return jsonify({
            'total_items': total_items.count or 0,
            'successfully_returned': returned.count or 0,
            'active_reports': active.count or 0,
            'total_found': found.count or 0,
            'total_lost': lost.count or 0
        })
    except Exception as e:
        print(f"[Public Stats Error]: {e}")
        return jsonify({'error': str(e)}), 500

@public_bp.route('/settings/public', methods=['GET'])
def get_public_settings():
    """Returns institution contact and security desk info from Supabase database."""
    client = get_supabase_client()
    default_settings = {
        'system_name': 'Findlt – Campus Lost & Found System',
        'college_name': 'State University & Affiliated Institutes',
        'security_hotline': '+1 (555) 019-9000',
        'central_office': 'Central Campus Security Desk (Gate 2)',
        'contact_email': 'lostfound@campus.edu',
        'operating_hours': '24 Hours / 7 Days a Week (Security Desk)'
    }

    if not client:
        return jsonify(default_settings)

    try:
        res = client.table('system_settings').select('setting_value').eq('setting_key', 'campus_info').limit(1).execute()
        if res.data and len(res.data) > 0:
            val = res.data[0].get('setting_value', {})
            merged = dict(default_settings)
            merged.update(val)
            return jsonify(merged)
        return jsonify(default_settings)
    except Exception:
        return jsonify(default_settings)

@public_bp.route('/categories', methods=['GET'])
def get_categories():
    """Returns active categories from item_categories table."""
    client = get_supabase_client()
    if not client:
        return db_error_response()

    try:
        res = client.table('item_categories').select('*').eq('is_active', True).order('category_name').execute()
        return jsonify(res.data or [])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@public_bp.route('/my/reports', methods=['GET'])
@token_required
def get_my_reports():
    """Returns all lost and found reports logged by the authenticated student."""
    client = get_supabase_client()
    if not client:
        return db_error_response()

    user = g.current_user
    try:
        res = client.table('items').select('*').eq('user_id', user['userId']).order('created_at', desc=True).execute()
        items = res.data or []
        lost = [i for i in items if i.get('item_type') == 'lost']
        found = [i for i in items if i.get('item_type') == 'found']

        return jsonify({
            'lost': lost,
            'found': found,
            'total_lost': len(lost),
            'total_found': len(found)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
