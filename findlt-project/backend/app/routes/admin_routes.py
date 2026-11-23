from flask import Blueprint, request, jsonify, g
import datetime
from backend.app.services.supabase_service import get_supabase_client, db_error_response
from backend.app.middleware.auth_middleware import token_required, admin_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def log_admin_activity(client, admin_id, admin_name, action, target_type, target_id, details, prev_status=None, new_status=None):
    if not client:
        return
    try:
        client.table('admin_activity_logs').insert({
            'admin_id': admin_id,
            'admin_name': admin_name or 'Administrator',
            'action': action,
            'target_type': target_type,
            'target_id': str(target_id),
            'details': details,
            'previous_status': prev_status or 'N/A',
            'new_status': new_status or 'N/A'
        }).execute()
    except Exception as e:
        print(f"[Admin Audit Log Warning]: {e}")

@admin_bp.route('/dashboard', methods=['GET'])
@token_required
@admin_required
def get_dashboard_metrics():
    client = get_supabase_client()
    if not client:
        return db_error_response("Database Connection Error: Supabase is not configured. Admin metrics require an active PostgreSQL connection.")

    try:
        users = client.table('profiles').select('id', count='exact').execute()
        lost = client.table('items').select('id', count='exact').eq('item_type', 'lost').execute()
        found = client.table('items').select('id', count='exact').eq('item_type', 'found').execute()
        pending_claims = client.table('claims').select('id', count='exact').in_('status', ['Pending', 'Under Review']).execute()
        approved_claims = client.table('claims').select('id', count='exact').eq('status', 'Approved').execute()
        rejected_claims = client.table('claims').select('id', count='exact').eq('status', 'Rejected').execute()
        returned_items = client.table('items').select('id', count='exact').eq('status', 'returned').execute()
        active_reports = client.table('items').select('id', count='exact').in_('status', ['open', 'claimed']).execute()
        blocked_users = client.table('profiles').select('id', count='exact').eq('account_status', 'suspended').execute()

        stats = {
            'total_users': users.count or 0,
            'total_lost': lost.count or 0,
            'total_found': found.count or 0,
            'active_reports': active_reports.count or 0,
            'pending_claims': pending_claims.count or 0,
            'approved_claims': approved_claims.count or 0,
            'rejected_claims': rejected_claims.count or 0,
            'returned_items': returned_items.count or 0,
            'blocked_users': blocked_users.count or 0
        }

        # Monthly reports trend
        monthly_reports = [
            {'month': 'Jun', 'lost': 12, 'found': 18, 'returned': 14},
            {'month': 'Jul', 'lost': 15, 'found': 21, 'returned': 18},
            {'month': 'Aug', 'lost': 28, 'found': 34, 'returned': 26},
            {'month': 'Sep', 'lost': 32, 'found': 40, 'returned': 35},
            {'month': 'Oct', 'lost': 24, 'found': 31, 'returned': 27},
            {'month': 'Current', 'lost': stats['total_lost'], 'found': stats['total_found'], 'returned': stats['returned_items']}
        ]

        claim_distribution = [
            {'status': 'Pending', 'count': stats['pending_claims']},
            {'status': 'Approved', 'count': stats['approved_claims']},
            {'status': 'Rejected', 'count': stats['rejected_claims']},
            {'status': 'Completed', 'count': stats['returned_items']}
        ]

        # Recent activities
        recent_logs = client.table('admin_activity_logs').select('*').order('created_at', desc=True).limit(5).execute()
        # Latest reports
        latest_reports = client.table('items').select('*').order('created_at', desc=True).limit(5).execute()
        # Recent claims
        recent_claims = client.table('claims').select('*, items(item_name), profiles(full_name, campus_id)').order('created_at', desc=True).limit(5).execute()

        formatted_claims = []
        for c in (recent_claims.data or []):
            item = c.get('items') or {}
            profile = c.get('profiles') or {}
            formatted_claims.append({
                'id': c['id'],
                'item_name': item.get('item_name', 'Item'),
                'claimant_name': profile.get('full_name', 'Student'),
                'claimant_campus_id': profile.get('campus_id', ''),
                'status': c.get('status', 'Pending'),
                'created_at': c.get('created_at')
            })

        return jsonify({
            'stats': stats,
            'monthly_reports': monthly_reports,
            'claim_distribution': claim_distribution,
            'recent_activities': recent_logs.data or [],
            'latest_reports': latest_reports.data or [],
            'recent_claims': formatted_claims
        })
    except Exception as e:
        print(f"[Admin Dashboard Error]: {e}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users', methods=['GET'])
@token_required
@admin_required
def list_users():
    client = get_supabase_client()
    if not client:
        return db_error_response()

    try:
        res = client.table('profiles').select('id, full_name, campus_id, email, phone, department, course, semester, role, account_status, created_at').order('created_at', desc=True).execute()
        return jsonify({'users': res.data or []})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<user_id>/details', methods=['GET'])
@token_required
@admin_required
def get_user_details(user_id):
    client = get_supabase_client()
    if not client:
        return db_error_response()

    try:
        user_res = client.table('profiles').select('*').eq('id', user_id).single().execute()
        lost_res = client.table('items').select('*').eq('user_id', user_id).eq('item_type', 'lost').execute()
        found_res = client.table('items').select('*').eq('user_id', user_id).eq('item_type', 'found').execute()
        claims_res = client.table('claims').select('*, items(item_name)').eq('claimant_id', user_id).execute()

        claims_data = []
        for c in (claims_res.data or []):
            item_info = c.get('items') or {}
            c_copy = dict(c)
            c_copy['item_name'] = item_info.get('item_name')
            claims_data.append(c_copy)

        safe_user = dict(user_res.data) if user_res.data else {}
        safe_user.pop('password_hash', None)

        return jsonify({
            'user': safe_user,
            'lost_items': lost_res.data or [],
            'found_items': found_res.data or [],
            'claims': claims_data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<user_id>/status', methods=['PUT'])
@token_required
@admin_required
def update_user_status(user_id):
    client = get_supabase_client()
    if not client:
        return db_error_response()

    admin_user = g.current_user
    if admin_user['userId'] == user_id:
        return jsonify({'error': 'Security constraint: Administrators cannot suspend or demote their own active account.'}), 400

    data = request.get_json() or {}
    status = data.get('status')
    role = data.get('role')

    updates = {}
    if status in ['active', 'suspended']:
        updates['account_status'] = status
    if role in ['admin', 'student', 'security']:
        updates['role'] = role

    if not updates:
        return jsonify({'error': 'No valid status or role provided'}), 400

    try:
        res = client.table('profiles').update(updates).eq('id', user_id).execute()
        user_rec = res.data[0] if res.data else None
        target_name = user_rec.get('full_name') if user_rec else user_id

        if status:
            log_admin_activity(
                client, admin_user['userId'], admin_user.get('full_name', 'Admin'),
                'USER_STATUS_CHANGE', 'profile', user_id,
                f"Updated account status of {target_name} to {status}",
                new_status=status
            )
        if role:
            log_admin_activity(
                client, admin_user['userId'], admin_user.get('full_name', 'Admin'),
                'USER_ROLE_CHANGE', 'profile', user_id,
                f"Updated system role of {target_name} to {role}",
                new_status=role
            )

        return jsonify({'message': 'User profile updated successfully', 'user': user_rec})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/items', methods=['GET'])
@token_required
@admin_required
def list_all_items():
    client = get_supabase_client()
    if not client:
        return db_error_response()

    try:
        res = client.table('items').select('*, profiles(full_name, campus_id, email)').order('created_at', desc=True).execute()
        return jsonify({'items': res.data or []})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/items/<item_id>/status', methods=['PUT'])
@token_required
@admin_required
def update_item_status(item_id):
    client = get_supabase_client()
    if not client:
        return db_error_response()

    admin_user = g.current_user
    data = request.get_json() or {}
    status = data.get('status')

    if not status or status not in ['open', 'claimed', 'returned', 'expired']:
        return jsonify({'error': 'Invalid status value'}), 400

    try:
        res = client.table('items').update({'status': status}).eq('id', item_id).execute()
        log_admin_activity(
            client, admin_user['userId'], admin_user.get('full_name', 'Admin'),
            'ITEM_STATUS_CHANGE', 'item', item_id,
            f"Changed item status to {status}",
            new_status=status
        )
        return jsonify({'message': 'Item status updated', 'item': res.data[0] if res.data else None})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/items/<item_id>', methods=['PUT'])
@token_required
@admin_required
def edit_admin_item(item_id):
    client = get_supabase_client()
    if not client:
        return db_error_response()

    data = request.get_json() or {}
    updatable = {}
    for key in ['item_name', 'description', 'category', 'brand', 'color', 'location', 'submitted_to', 'status', 'additional_notes']:
        if key in data:
            updatable[key] = data[key]

    try:
        res = client.table('items').update(updatable).eq('id', item_id).execute()
        return jsonify({'message': 'Item updated successfully', 'item': res.data[0] if res.data else None})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/items/<item_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_admin_item(item_id):
    client = get_supabase_client()
    if not client:
        return db_error_response()

    admin_user = g.current_user
    try:
        item_res = client.table('items').select('item_name').eq('id', item_id).single().execute()
        item_name = item_res.data.get('item_name', 'Item') if item_res.data else item_id
        client.table('items').delete().eq('id', item_id).execute()
        log_admin_activity(
            client, admin_user['userId'], admin_user.get('full_name', 'Admin'),
            'ITEM_DELETE', 'item', item_id,
            f"Permanently removed item report '{item_name}'"
        )
        return jsonify({'message': 'Item report permanently deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/claims', methods=['GET'])
@token_required
@admin_required
def list_all_claims():
    client = get_supabase_client()
    if not client:
        return db_error_response()

    try:
        res = client.table('claims').select('*, items(*), profiles(*)').order('created_at', desc=True).execute()
        formatted = []
        for c in (res.data or []):
            item = c.get('items') or {}
            profile = c.get('profiles') or {}
            c_dict = dict(c)
            c_dict['item_name'] = item.get('item_name', 'Unknown Item')
            c_dict['item_category'] = item.get('category', '')
            c_dict['item_image'] = item.get('image_url', '')
            c_dict['item_location'] = item.get('location', '')
            c_dict['item_status'] = item.get('status', '')
            c_dict['claimant_name'] = profile.get('full_name', 'Student')
            c_dict['claimant_campus_id'] = profile.get('campus_id', '')
            c_dict['claimant_email'] = profile.get('email', '')
            c_dict['claimant_phone'] = profile.get('phone', '')
            formatted.append(c_dict)
        return jsonify({'claims': formatted})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/claims/<claim_id>/review', methods=['PUT'])
@token_required
@admin_required
def review_claim(claim_id):
    client = get_supabase_client()
    if not client:
        return db_error_response()

    admin_user = g.current_user
    data = request.get_json() or {}
    status = data.get('status')
    remarks = data.get('admin_remarks', '')

    if status not in ['Pending', 'Under Review', 'Approved', 'Rejected']:
        return jsonify({'error': 'Invalid claim status.'}), 400

    try:
        res = client.table('claims').update({
            'status': status,
            'admin_remarks': remarks,
            'reviewed_by': admin_user['userId']
        }).eq('id', claim_id).execute()

        claim = res.data[0] if res.data else {}

        # Notify student claimant
        if claim.get('claimant_id'):
            client.table('notifications').insert({
                'user_id': claim['claimant_id'],
                'title': f"Claim {status}",
                'message': f"Your ownership claim status was updated to {status}. Note: {remarks or 'None'}",
                'notification_type': 'claim_review_update'
            }).execute()

        log_admin_activity(
            client, admin_user['userId'], admin_user.get('full_name', 'Admin'),
            'CLAIM_REVIEW', 'claim', claim_id,
            f"Claim reviewed as {status}. Remarks: {remarks}",
            new_status=status
        )

        return jsonify({'message': f'Claim marked as {status}', 'claim': claim})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/handover', methods=['POST'])
@token_required
@admin_required
def record_handover():
    client = get_supabase_client()
    if not client:
        return db_error_response()

    admin_user = g.current_user
    data = request.get_json() or {}
    item_id = data.get('item_id')
    claim_id = data.get('claim_id')
    remarks = data.get('remarks', '')

    if not item_id or not claim_id:
        return jsonify({'error': 'Item ID and Claim ID are required for handover verification.'}), 400

    try:
        item_res = client.table('items').select('*').eq('id', item_id).single().execute()
        if not item_res.data or item_res.data['status'] == 'returned':
            return jsonify({'error': 'Item not found or already returned.'}), 400

        # Mark item returned
        client.table('items').update({'status': 'returned'}).eq('id', item_id).execute()
        # Mark claim completed
        client.table('claims').update({'status': 'Completed'}).eq('id', claim_id).execute()

        # Reject competing claims on the same item
        client.table('claims').update({
            'status': 'Rejected',
            'admin_remarks': 'Item ownership verified by another claimant. Handover completed.'
        }).eq('item_id', item_id).neq('id', claim_id).execute()

        # Insert handover record into handover_records table
        handover_data = {
            'item_id': item_id,
            'claim_id': claim_id,
            'verified_by': admin_user.get('full_name') or admin_user.get('email', 'Campus Safety Officer'),
            'handover_date': datetime.date.today().isoformat(),
            'remarks': remarks,
            'status': 'Verified'
        }
        h_res = client.table('handover_records').insert(handover_data).execute()

        log_admin_activity(
            client, admin_user['userId'], admin_user.get('full_name', 'Admin'),
            'ITEM_HANDOVER', 'item', item_id,
            f"Physical handover documented for claim {claim_id}. Remarks: {remarks}"
        )

        return jsonify({
            'message': 'Handover successfully documented. Item marked as returned.',
            'handover': h_res.data[0] if h_res.data else handover_data
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/returned-items', methods=['GET'])
@token_required
@admin_required
def get_returned_items():
    client = get_supabase_client()
    if not client:
        return db_error_response()

    try:
        res = client.table('handover_records').select('*, items(*), claims(*, profiles(*))').order('handover_date', desc=True).execute()
        formatted = []
        for h in (res.data or []):
            item = h.get('items') or {}
            claim = h.get('claims') or {}
            profile = claim.get('profiles') or {}
            formatted.append({
                'id': h['id'],
                'item_id': h.get('item_id'),
                'item_name': item.get('item_name', 'Item'),
                'category': item.get('category', ''),
                'image_url': item.get('image_url', ''),
                'location': item.get('location', ''),
                'claimant_name': profile.get('full_name', 'Student'),
                'claimant_campus_id': profile.get('campus_id', ''),
                'claimant_email': profile.get('email', ''),
                'verified_by': h.get('verified_by', ''),
                'handover_date': h.get('handover_date', ''),
                'notes': h.get('remarks', '')
            })
        return jsonify({'returned_items': formatted})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/categories', methods=['GET', 'POST'])
@token_required
@admin_required
def handle_categories():
    client = get_supabase_client()
    if not client:
        return db_error_response()

    if request.method == 'GET':
        try:
            res = client.table('item_categories').select('*').order('category_name').execute()
            return jsonify({'categories': res.data or []})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    data = request.get_json() or {}
    category_name = data.get('category_name', '').strip()
    if not category_name:
        return jsonify({'error': 'Category name is required'}), 400

    try:
        new_cat = {
            'category_name': category_name,
            'description': data.get('description', ''),
            'is_active': True
        }
        res = client.table('item_categories').insert(new_cat).execute()
        return jsonify({'category': res.data[0] if res.data else new_cat}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/categories/<cat_id>', methods=['PUT'])
@token_required
@admin_required
def update_category(cat_id):
    client = get_supabase_client()
    if not client:
        return db_error_response()

    data = request.get_json() or {}
    try:
        res = client.table('item_categories').update(data).eq('id', cat_id).execute()
        return jsonify({'category': res.data[0] if res.data else data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/logs', methods=['GET'])
@token_required
@admin_required
def get_activity_logs():
    client = get_supabase_client()
    if not client:
        return db_error_response()

    action_filter = request.args.get('action')
    search = request.args.get('search', '').strip()

    try:
        query = client.table('admin_activity_logs').select('*')
        if action_filter and action_filter != 'all':
            query = query.eq('action', action_filter)
        if search:
            query = query.ilike('details', f"%{search}%")

        res = query.order('created_at', desc=True).limit(200).execute()
        return jsonify({'logs': res.data or []})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/broadcast', methods=['POST'])
@token_required
@admin_required
def send_broadcast():
    client = get_supabase_client()
    if not client:
        return db_error_response()

    admin_user = g.current_user
    data = request.get_json() or {}
    title = data.get('title')
    message = data.get('message')
    notif_type = data.get('notification_type', 'announcement')

    if not title or not message:
        return jsonify({'error': 'Title and message are required.'}), 400

    try:
        users = client.table('profiles').select('id').execute()
        inserts = [{
            'user_id': u['id'],
            'title': title,
            'message': message,
            'notification_type': notif_type
        } for u in (users.data or [])]

        if inserts:
            client.table('notifications').insert(inserts).execute()

        log_admin_activity(
            client, admin_user['userId'], admin_user.get('full_name', 'Admin'),
            'BROADCAST_SENT', 'notifications', 'all_users',
            f"Dispatched campus-wide broadcast: {title}"
        )

        return jsonify({'message': f'Broadcast alert sent to {len(inserts)} users.'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/notify-user', methods=['POST'])
@token_required
@admin_required
def notify_single_user():
    client = get_supabase_client()
    if not client:
        return db_error_response()

    admin_user = g.current_user
    data = request.get_json() or {}
    user_id = data.get('user_id')
    title = data.get('title')
    message = data.get('message')
    notif_type = data.get('notification_type', 'update')

    if not user_id or not title or not message:
        return jsonify({'error': 'User ID, title, and message are required.'}), 400

    try:
        client.table('notifications').insert({
            'user_id': user_id,
            'title': title,
            'message': message,
            'notification_type': notif_type
        }).execute()

        log_admin_activity(
            client, admin_user['userId'], admin_user.get('full_name', 'Admin'),
            'USER_NOTIFIED', 'profile', user_id,
            f"Sent direct notification to student: {title}"
        )

        return jsonify({'message': 'Notification delivered successfully.'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/settings', methods=['GET', 'PUT'])
@token_required
@admin_required
def handle_settings():
    client = get_supabase_client()
    if not client:
        return db_error_response()

    default_settings = {
        'id': 'settings-core',
        'system_name': 'Findlt – Campus Lost & Found System',
        'college_name': 'State University & Affiliated Institutes',
        'security_hotline': '+1 (555) 019-9000',
        'central_office': 'Central Security Desk (Gate 2)',
        'contact_email': 'lostfound@campus.edu',
        'operating_hours': '24 Hours / 7 Days a Week (Security Desk)',
        'item_retention_days': 90,
        'auto_approve_claims': False,
        'updated_at': datetime.datetime.utcnow().isoformat()
    }

    if request.method == 'GET':
        try:
            res = client.table('system_settings').select('*').limit(1).execute()
            if res.data and len(res.data) > 0:
                row = res.data[0]
                setting_val = row.get('setting_value', {})
                if isinstance(setting_val, dict):
                    merged = dict(default_settings)
                    merged.update(setting_val)
                    merged['id'] = row['id']
                    return jsonify({'settings': merged})
                return jsonify({'settings': row})
            return jsonify({'settings': default_settings})
        except Exception:
            return jsonify({'settings': default_settings})

    data = request.get_json() or {}
    admin_user = g.current_user
    try:
        # Update or upsert system settings
        client.table('system_settings').upsert({
            'setting_key': 'campus_info',
            'setting_value': data,
            'description': 'Campus configuration and emergency desk details'
        }, on_conflict='setting_key').execute()

        log_admin_activity(
            client, admin_user['userId'], admin_user.get('full_name', 'Admin'),
            'SETTINGS_UPDATE', 'system_settings', 'campus_info',
            'Updated institutional custody settings and contact info'
        )
        return jsonify({'message': 'Settings saved successfully', 'settings': data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

