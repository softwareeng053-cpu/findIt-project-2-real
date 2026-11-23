
import datetime
import jwt
from urllib.parse import urlparse

from flask import Blueprint, request, jsonify, g

from backend.config import Config
from backend.app.services.supabase_service import (
    get_supabase_client,
    db_error_response,
    upload_base64_to_storage,
    upload_image_to_storage
)
from backend.app.middleware.auth_middleware import token_required


item_bp = Blueprint('items', __name__, url_prefix='/api/items')

ALLOWED_ITEM_TYPES = ('lost', 'found')
ALLOWED_STATUSES = ('open', 'claimed', 'returned', 'expired')

ALLOWED_IMAGE_TYPES = {
    'image/jpeg',
    'image/png',
    'image/webp'
}

MAX_IMAGE_SIZE = 5 * 1024 * 1024


# ==========================================
# HELPER FUNCTIONS
# ==========================================

def clean_text(value, max_length=None):
    if not isinstance(value, str):
        return ''

    value = value.strip()

    if max_length:
        value = value[:max_length]

    return value


def process_item_image(raw_image):
    """
    Accept:
    1. Base64 image data URL.
    2. Existing public URL from this Supabase project.
    """

    if not raw_image:
        return ''

    if not isinstance(raw_image, str):
        raise ValueError('Invalid image data.')

    raw_image = raw_image.strip()

    # Base64 image upload
    if raw_image.startswith('data:image/'):
        image_url = upload_base64_to_storage(raw_image)

        if not image_url:
            raise ValueError('Image upload failed.')

        return image_url

    # Validate Supabase public Storage URL
    supabase_url = getattr(Config, 'SUPABASE_URL', None)

    if not supabase_url:
        raise ValueError(
            'SUPABASE_URL is not configured in backend.'
        )

    expected = urlparse(supabase_url)
    supplied = urlparse(raw_image)

    if (
        supplied.scheme != 'https'
        or supplied.netloc != expected.netloc
        or not supplied.path.startswith(
            '/storage/v1/object/public/'
        )
    ):
        raise ValueError('Invalid Supabase image URL.')

    return raw_image


def get_optional_verified_user(client):
    auth_header = request.headers.get('Authorization', '')

    if not auth_header:
        return None

    parts = auth_header.split()

    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None

    try:
        payload = jwt.decode(
            parts[1],
            Config.JWT_SECRET,
            algorithms=['HS256']
        )

        user_id = payload.get('userId')

        if not user_id:
            return None

        result = (
            client.table('profiles')
            .select('id, role, account_status')
            .eq('id', user_id)
            .limit(1)
            .execute()
        )

        if not result.data:
            return None

        profile = result.data[0]

        if profile.get('account_status') != 'active':
            return None

        return {
            'userId': profile['id'],
            'role': profile.get('role'),
            'account_status': profile.get('account_status')
        }

    except Exception as error:
        print(f'[Optional Authentication Error]: {error}')
        return None


def create_notification(client, user_id, title, message):
    try:
        client.table('notifications').insert({
            'user_id': user_id,
            'title': title,
            'message': message,
            'notification_type': 'report_created'
        }).execute()

    except Exception as error:
        print(f'[Notification Creation Error]: {error}')


# ==========================================
# GET ALL ITEMS
# ==========================================

@item_bp.route('', methods=['GET'])
def list_items():
    client = get_supabase_client()

    if not client:
        return db_error_response(
            'Database Connection Error: Please configure Supabase in backend/.env.'
        )

    item_type = clean_text(
        request.args.get('type'), 20
    ).lower()

    category = clean_text(
        request.args.get('category'), 100
    )

    status = clean_text(
        request.args.get('status'), 20
    ).lower()

    search = clean_text(
        request.args.get('search'), 100
    )

    try:
        page = max(1, int(request.args.get('page', 1)))
        limit = max(1, min(50, int(request.args.get('limit', 12))))
    except (ValueError, TypeError):
        return jsonify({
            'error': 'Page and limit must be valid numbers.'
        }), 400

    if item_type and item_type != 'all':
        if item_type not in ALLOWED_ITEM_TYPES:
            return jsonify({'error': 'Invalid item type.'}), 400

    if status and status != 'all':
        if status not in ALLOWED_STATUSES:
            return jsonify({'error': 'Invalid item status.'}), 400

    try:
        query = client.table('items').select('*', count='exact')

        if item_type and item_type != 'all':
            query = query.eq('item_type', item_type)

        if category and category.lower() != 'all':
            query = query.ilike('category', category)

        if status and status != 'all':
            query = query.eq('status', status)

        if search:
            safe_search = (
                search.replace(',', ' ')
                .replace('(', ' ')
                .replace(')', ' ')
            )

            query = query.or_(
                f'item_name.ilike.%{safe_search}%,'
                f'description.ilike.%{safe_search}%,'
                f'location.ilike.%{safe_search}%'
            )

        offset = (page - 1) * limit

        result = (
            query.order('created_at', desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        safe_items = []

        for item in (result.data or []):
            safe_item = dict(item)
            safe_item.pop('user_id', None)
            safe_items.append(safe_item)

        total_count = (
            result.count
            if result.count is not None
            else len(safe_items)
        )

        return jsonify({
            'items': safe_items,
            'page': page,
            'limit': limit,
            'total_count': total_count,
            'total_pages': max(
                1,
                (total_count + limit - 1) // limit
            )
        }), 200

    except Exception as error:
        print(f'[List Items Error]: {error}')
        return jsonify({
            'error': 'Failed to retrieve items.'
        }), 500


# ==========================================
# GET SINGLE ITEM
# ==========================================

@item_bp.route('/<item_id>', methods=['GET'])
def get_item(item_id):
    client = get_supabase_client()

    if not client:
        return db_error_response()

    try:
        result = (
            client.table('items')
            .select('*, profiles(full_name, email, phone, campus_id)')
            .eq('id', item_id)
            .limit(1)
            .execute()
        )

        if not result.data:
            return jsonify({
                'error': 'Item report not found.'
            }), 404

        safe_item = dict(result.data[0])

        verified_user = get_optional_verified_user(client)

        is_authorized = False

        if verified_user:
            is_owner = (
                str(verified_user.get('userId'))
                == str(safe_item.get('user_id'))
            )

            is_admin = verified_user.get('role') == 'admin'

            is_authorized = is_owner or is_admin

        if not is_authorized:
            safe_item.pop('user_id', None)
            safe_item.pop('profiles', None)

        return jsonify({'item': safe_item}), 200

    except Exception as error:
        print(f'[Get Item Error]: {error}')
        return jsonify({
            'error': 'Failed to fetch item.'
        }), 500


# ==========================================
# UPLOAD IMAGE TO SUPABASE STORAGE
# ==========================================

@item_bp.route('/upload', methods=['POST'])
@token_required
def upload_item_image():
    client = get_supabase_client()

    if not client:
        return db_error_response()

    if 'image' not in request.files:
        return jsonify({
            'error': 'No image file provided in form-data.'
        }), 400

    file = request.files['image']

    if not file.filename:
        return jsonify({
            'error': 'Empty filename.'
        }), 400

    content_type = (file.mimetype or '').lower()

    if content_type not in ALLOWED_IMAGE_TYPES:
        return jsonify({
            'error': 'Only JPG, PNG and WEBP images are allowed.'
        }), 400

    file_bytes = file.read(MAX_IMAGE_SIZE + 1)

    if not file_bytes:
        return jsonify({
            'error': 'Image file is empty.'
        }), 400

    if len(file_bytes) > MAX_IMAGE_SIZE:
        return jsonify({
            'error': 'Image size must not exceed 5 MB.'
        }), 400

    try:
        public_url = upload_image_to_storage(
            file_bytes,
            file.filename,
            content_type
        )

        if not public_url:
            return jsonify({
                'error': 'Failed to upload image to Supabase Storage.'
            }), 500

        return jsonify({
            'url': public_url,
            'message': 'Image uploaded successfully.'
        }), 200

    except Exception as error:
        print(f'[Image Upload Error]: {error}')
        return jsonify({
            'error': 'Image upload failed.'
        }), 500


# ==========================================
# REPORT LOST ITEM
# ==========================================

@item_bp.route('/lost', methods=['POST'])
@token_required
def report_lost_item():
    client = get_supabase_client()

    if not client:
        return db_error_response()

    user = g.current_user
    data = request.get_json(silent=True) or {}

    if not isinstance(data, dict):
        return jsonify({'error': 'Invalid request data.'}), 400

    item_name = clean_text(data.get('item_name'), 200)
    category = clean_text(data.get('category'), 100)
    description = clean_text(data.get('description'), 5000)

    last_seen_location = clean_text(
        data.get('last_seen_location'), 255
    )

    if not all([
        item_name,
        category,
        description,
        last_seen_location
    ]):
        return jsonify({
            'error': 'Item name, category, description, and last seen location are required.'
        }), 400

    try:
        image_url = process_item_image(
            data.get('image_url', '')
        )
    except ValueError as error:
        return jsonify({'error': str(error)}), 400

    new_item = {
        'user_id': user['userId'],
        'item_name': item_name,
        'category': category,
        'item_type': 'lost',
        'brand': clean_text(data.get('brand'), 100),
        'color': clean_text(data.get('color'), 60),
        'image_url': image_url,
        'report_date': (
            data.get('last_seen_date')
            or datetime.date.today().isoformat()
        ),
        'location': last_seen_location,
        'status': 'open',
        'description': description,
        'additional_notes': clean_text(
            data.get('additional_details'), 5000
        )
    }

    try:
        result = client.table('items').insert(new_item).execute()

        if not result.data:
            return jsonify({
                'error': 'Item report could not be saved.'
            }), 500

        created_item = result.data[0]

        create_notification(
            client,
            user['userId'],
            'Lost Item Report Published',
            f"Your report for '{item_name}' is active on the campus directory."
        )

        return jsonify({
            'message': 'Lost report submitted successfully.',
            'item': created_item
        }), 201

    except Exception as error:
        print(f'[Lost Report Error]: {error}')
        return jsonify({
            'error': 'Failed to create lost item report.'
        }), 500


# ==========================================
# REPORT FOUND ITEM
# ==========================================

@item_bp.route('/found', methods=['POST'])
@token_required
def report_found_item():
    client = get_supabase_client()

    if not client:
        return db_error_response()

    user = g.current_user
    data = request.get_json(silent=True) or {}

    if not isinstance(data, dict):
        return jsonify({'error': 'Invalid request data.'}), 400

    item_name = clean_text(data.get('item_name'), 200)
    category = clean_text(data.get('category'), 100)
    description = clean_text(data.get('description'), 5000)

    found_location = clean_text(
        data.get('found_location'), 255
    )

    if not all([
        item_name,
        category,
        description,
        found_location
    ]):
        return jsonify({
            'error': 'Item name, category, description, and found location are required.'
        }), 400

    try:
        image_url = process_item_image(
            data.get('image_url', '')
        )
    except ValueError as error:
        return jsonify({'error': str(error)}), 400

    new_item = {
        'user_id': user['userId'],
        'item_name': item_name,
        'category': category,
        'item_type': 'found',
        'brand': clean_text(data.get('brand'), 100),
        'color': clean_text(data.get('color'), 60),
        'image_url': image_url,
        'report_date': (
            data.get('found_date')
            or datetime.date.today().isoformat()
        ),
        'location': found_location,
        'submitted_to': clean_text(
            data.get('submitted_to') or 'Campus Security Desk',
            255
        ),
        'status': 'open',
        'description': description,
        'additional_notes': clean_text(
            data.get('additional_notes'), 5000
        )
    }

    try:
        result = client.table('items').insert(new_item).execute()

        if not result.data:
            return jsonify({
                'error': 'Found item report could not be saved.'
            }), 500

        created_item = result.data[0]

        create_notification(
            client,
            user['userId'],
            'Found Item Registered',
            f"Thank you for logging '{item_name}'. Verified owners can now request a claim."
        )

        return jsonify({
            'message': 'Found report registered successfully.',
            'item': created_item
        }), 201

    except Exception as error:
        print(f'[Found Report Error]: {error}')
        return jsonify({
            'error': 'Failed to create found item report.'
        }), 500


# ==========================================
# UPDATE ITEM
# ==========================================

@item_bp.route('/<item_id>', methods=['PUT'])
@token_required
def update_item(item_id):
    client = get_supabase_client()

    if not client:
        return db_error_response()

    user = g.current_user
    data = request.get_json(silent=True) or {}

    if not isinstance(data, dict) or not data:
        return jsonify({
            'error': 'Valid update data is required.'
        }), 400

    try:
        item_result = (
            client.table('items')
            .select('*')
            .eq('id', item_id)
            .limit(1)
            .execute()
        )

        if not item_result.data:
            return jsonify({'error': 'Item not found.'}), 404

        existing_item = item_result.data[0]

        is_admin = user.get('role') == 'admin'

        is_owner = (
            str(existing_item.get('user_id'))
            == str(user['userId'])
        )

        if not is_admin and not is_owner:
            return jsonify({
                'error': 'Unauthorized to modify this item.'
            }), 403

        updatable = {}

        text_fields = {
            'item_name': 200,
            'description': 5000,
            'category': 100,
            'brand': 100,
            'color': 60,
            'location': 255,
            'additional_notes': 5000,
            'submitted_to': 255
        }

        for key, max_length in text_fields.items():
            if key in data:
                value = clean_text(data[key], max_length)

                if key in (
                    'item_name',
                    'description',
                    'category',
                    'location'
                ) and not value:
                    return jsonify({
                        'error': f'{key} cannot be empty.'
                    }), 400

                updatable[key] = value

        # Image URL update
        if 'image_url' in data:
            try:
                updatable['image_url'] = process_item_image(
                    data['image_url']
                )
            except ValueError as error:
                return jsonify({'error': str(error)}), 400

        # Only admins can change status
        if 'status' in data:
            if not is_admin:
                return jsonify({
                    'error': 'Only an administrator can change item status.'
                }), 403

            new_status = clean_text(
                data['status'], 20
            ).lower()

            if new_status not in ALLOWED_STATUSES:
                return jsonify({
                    'error': 'Invalid item status.'
                }), 400

            updatable['status'] = new_status

        if not updatable:
            return jsonify({
                'error': 'No valid fields provided for update.'
            }), 400

        result = (
            client.table('items')
            .update(updatable)
            .eq('id', item_id)
            .execute()
        )

        if not result.data:
            return jsonify({
                'error': 'Item update failed.'
            }), 500

        return jsonify({
            'message': 'Item updated successfully.',
            'item': result.data[0]
        }), 200

    except Exception as error:
        print(f'[Update Item Error]: {error}')
        return jsonify({
            'error': 'Failed to update item.'
        }), 500


# ==========================================
# DELETE ITEM
# ==========================================

@item_bp.route('/<item_id>', methods=['DELETE'])
@token_required
def delete_item(item_id):
    client = get_supabase_client()

    if not client:
        return db_error_response()

    user = g.current_user

    try:
        item_result = (
            client.table('items')
            .select('id, user_id')
            .eq('id', item_id)
            .limit(1)
            .execute()
        )

        if not item_result.data:
            return jsonify({'error': 'Item not found.'}), 404

        item = item_result.data[0]

        is_admin = user.get('role') == 'admin'

        is_owner = (
            str(item.get('user_id'))
            == str(user['userId'])
        )

        if not is_admin and not is_owner:
            return jsonify({
                'error': 'Unauthorized to delete this item.'
            }), 403

        client.table('items').delete().eq(
            'id', item_id
        ).execute()

        return jsonify({
            'message': 'Item deleted successfully.'
        }), 200

    except Exception as error:
        print(f'[Delete Item Error]: {error}')
        return jsonify({
            'error': 'Failed to delete item.'
        }), 500
