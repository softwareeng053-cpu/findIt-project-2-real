from flask import Blueprint, request, jsonify, g
import datetime
from backend.app.services.supabase_service import get_supabase_client, db_error_response, upload_base64_to_storage, upload_image_to_storage
from backend.app.middleware.auth_middleware import token_required

item_bp = Blueprint('items', __name__, url_prefix='/api/items')

@item_bp.route('', methods=['GET'])
def list_items():
    client = get_supabase_client()
    if not client:
        return db_error_response("Database Connection Error: Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY in backend/.env to load items.")

    item_type = request.args.get('type')
    category = request.args.get('category')
    status = request.args.get('status')
    search = request.args.get('search', '').strip().lower()
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 12))

    try:
        query = client.table('items').select('*', count='exact')
        if item_type and item_type != 'all':
            query = query.eq('item_type', item_type)
        if category and category != 'all':
            query = query.ilike('category', category)
        if status and status != 'all':
            query = query.eq('status', status)
        if search:
            query = query.or_(f"item_name.ilike.%{search}%,description.ilike.%{search}%,location.ilike.%{search}%")

        offset = (page - 1) * limit
        query = query.order('created_at', desc=True).range(offset, offset + limit - 1)
        res = query.execute()

        # Sanitize reporter personal id for public directory privacy
        safe_items = []
        for itm in (res.data or []):
            safe_itm = dict(itm)
            safe_itm.pop('user_id', None)
            safe_items.append(safe_itm)

        total_count = res.count if res.count is not None else len(safe_items)
        return jsonify({
            'items': safe_items,
            'page': page,
            'limit': limit,
            'total_count': total_count,
            'total_pages': max(1, (total_count + limit - 1) // limit)
        })
    except Exception as e:
        print(f"[List Items Error]: {e}")
        return jsonify({'error': f'Failed to retrieve items: {str(e)}'}), 500

@item_bp.route('/<item_id>', methods=['GET'])
def get_item(item_id):
    client = get_supabase_client()
    if not client:
        return db_error_response()

    try:
        res = client.table('items').select('*, profiles(full_name, email, phone, campus_id)').eq('id', item_id).single().execute()
        if not res.data:
            return jsonify({'error': 'Item report not found'}), 404

        safe_item = dict(res.data)
        # Check authorization if requester wants reporter contact
        auth_header = request.headers.get('Authorization')
        is_authorized = False
        if auth_header:
            from backend.config import Config
            import jwt
            try:
                token = auth_header.split(' ')[1]
                decoded = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
                if decoded.get('role') == 'admin' or decoded.get('userId') == safe_item.get('user_id'):
                    is_authorized = True
            except Exception:
                pass

        if not is_authorized:
            safe_item.pop('user_id', None)
            safe_item.pop('profiles', None)

        return jsonify({'item': safe_item})
    except Exception as e:
        return jsonify({'error': f'Failed to fetch item: {str(e)}'}), 500

@item_bp.route('/upload', methods=['POST'])
@token_required
def upload_item_image():
    client = get_supabase_client()
    if not client:
        return db_error_response()

    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided in form-data'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    file_bytes = file.read()
    content_type = file.content_type or 'image/jpeg'
    public_url = upload_image_to_storage(file_bytes, file.filename, content_type)

    if not public_url:
        return jsonify({'error': 'Failed to upload image to Supabase Storage. Please verify storage bucket permissions.'}), 500

    return jsonify({'url': public_url, 'message': 'Image uploaded successfully to Supabase Storage'}), 200

@item_bp.route('/lost', methods=['POST'])
@token_required
def report_lost_item():
    client = get_supabase_client()
    if not client:
        return db_error_response()

    user = g.current_user
    data = request.get_json() or {}
    item_name = data.get('item_name', '').strip()
    category = data.get('category', '').strip()
    description = data.get('description', '').strip()
    last_seen_location = data.get('last_seen_location', '').strip()

    if not all([item_name, category, description, last_seen_location]):
        return jsonify({'error': 'Item name, category, description, and last seen location are required.'}), 400

    raw_image = data.get('image_url', '')
    image_url = upload_base64_to_storage(raw_image) if raw_image else ''

    new_item = {
        'user_id': user['userId'],
        'item_name': item_name,
        'category': category,
        'item_type': 'lost',
        'brand': data.get('brand', '').strip(),
        'color': data.get('color', '').strip(),
        'image_url': image_url,
        'report_date': data.get('last_seen_date') or datetime.date.today().isoformat(),
        'location': last_seen_location,
        'status': 'open',
        'description': description,
        'additional_notes': data.get('additional_details', '')
    }

    try:
        res = client.table('items').insert(new_item).execute()
        created = res.data[0]

        # Create user notification in database
        client.table('notifications').insert({
            'user_id': user['userId'],
            'title': 'Lost Item Report Published',
            'message': f"Your report for '{item_name}' is active on the campus directory.",
            'notification_type': 'report_created'
        }).execute()

        return jsonify({'message': 'Lost report submitted successfully', 'item': created}), 201
    except Exception as e:
        print(f"[Lost Report Error]: {e}")
        return jsonify({'error': f'Failed to create lost item report: {str(e)}'}), 500

@item_bp.route('/found', methods=['POST'])
@token_required
def report_found_item():
    client = get_supabase_client()
    if not client:
        return db_error_response()

    user = g.current_user
    data = request.get_json() or {}
    item_name = data.get('item_name', '').strip()
    category = data.get('category', '').strip()
    description = data.get('description', '').strip()
    found_location = data.get('found_location', '').strip()

    if not all([item_name, category, description, found_location]):
        return jsonify({'error': 'Item name, category, description, and found location are required.'}), 400

    raw_image = data.get('image_url', '')
    # Save image to Supabase Storage if base64 data
    image_url = upload_base64_to_storage(raw_image) if raw_image else ''

    new_item = {
        'user_id': user['userId'],
        'item_name': item_name,
        'category': category,
        'item_type': 'found',
        'brand': data.get('brand', '').strip(),
        'color': data.get('color', '').strip(),
        'image_url': image_url,
        'report_date': data.get('found_date') or datetime.date.today().isoformat(),
        'location': found_location,
        'submitted_to': data.get('submitted_to', 'Campus Security Desk'),
        'status': 'open',
        'description': description,
        'additional_notes': data.get('additional_notes', '')
    }

    try:
        res = client.table('items').insert(new_item).execute()
        created = res.data[0]

        client.table('notifications').insert({
            'user_id': user['userId'],
            'title': 'Found Item Registered',
            'message': f"Thank you for logging '{item_name}'. Verified owners can now request a claim.",
            'notification_type': 'report_created'
        }).execute()

        return jsonify({'message': 'Found report registered successfully', 'item': created}), 201
    except Exception as e:
        print(f"[Found Report Error]: {e}")
        return jsonify({'error': f'Failed to create found item report: {str(e)}'}), 500

@item_bp.route('/<item_id>', methods=['PUT'])
@token_required
def update_item(item_id):
    client = get_supabase_client()
    if not client:
        return db_error_response()

    user = g.current_user
    data = request.get_json() or {}

    try:
        # Check permissions
        item_res = client.table('items').select('*').eq('id', item_id).single().execute()
        if not item_res.data:
            return jsonify({'error': 'Item not found'}), 404
        if user.get('role') != 'admin' and item_res.data['user_id'] != user['userId']:
            return jsonify({'error': 'Unauthorized to modify this item'}), 403

        updatable = {}
        for key in ['item_name', 'description', 'category', 'brand', 'color', 'location', 'status', 'additional_notes']:
            if key in data:
                updatable[key] = data[key]

        res = client.table('items').update(updatable).eq('id', item_id).execute()
        return jsonify({'message': 'Item updated successfully', 'item': res.data[0]})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@item_bp.route('/<item_id>', methods=['DELETE'])
@token_required
def delete_item(item_id):
    client = get_supabase_client()
    if not client:
        return db_error_response()

    user = g.current_user
    try:
        item_res = client.table('items').select('*').eq('id', item_id).single().execute()
        if not item_res.data:
            return jsonify({'error': 'Item not found'}), 404
        if user.get('role') != 'admin' and item_res.data['user_id'] != user['userId']:
            return jsonify({'error': 'Unauthorized to delete this item'}), 403

        client.table('items').delete().eq('id', item_id).execute()
        return jsonify({'message': 'Item deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

