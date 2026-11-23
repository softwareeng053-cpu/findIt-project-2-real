from flask import Blueprint, request, jsonify, g
from backend.app.services.supabase_service import get_supabase_client, db_error_response
from backend.app.middleware.auth_middleware import token_required

claim_bp = Blueprint('claims', __name__, url_prefix='/api/claims')

@claim_bp.route('', methods=['POST'])
@token_required
def submit_claim():
    client = get_supabase_client()
    if not client:
        return db_error_response("Database Connection Error: Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY in backend/.env to file item claims.")

    user = g.current_user
    data = request.get_json() or {}
    item_id = data.get('item_id')
    ownership_description = data.get('ownership_description', '').strip()
    evidence_url = data.get('evidence_url', '').strip()

    if not item_id or not ownership_description:
        return jsonify({'error': 'Item ID and detailed ownership description are required.'}), 400

    try:
        # Validate item
        item_res = client.table('items').select('*').eq('id', item_id).single().execute()
        if not item_res.data:
            return jsonify({'error': 'Item not found'}), 404
        if item_res.data['item_type'] != 'found':
            return jsonify({'error': 'Claims can only be placed on found items.'}), 400
        if item_res.data['status'] == 'returned':
            return jsonify({'error': 'This item has already been verified, returned, and closed.'}), 400

        # Prevent duplicate pending claim
        dup = client.table('claims').select('id').eq('item_id', item_id).eq('claimant_id', user['userId']).neq('status', 'Rejected').execute()
        if dup.data and len(dup.data) > 0:
            return jsonify({'error': 'You already have an active claim on this item. Check "My Claims".'}), 409

        claim_data = {
            'item_id': item_id,
            'claimant_id': user['userId'],
            'ownership_description': ownership_description,
            'evidence_url': evidence_url,
            'status': 'Pending',
            'admin_remarks': 'Claim submitted. In queue for administrative verification.'
        }
        res = client.table('claims').insert(claim_data).execute()
        created_claim = res.data[0]

        # Update item status to claimed
        client.table('items').update({'status': 'claimed'}).eq('id', item_id).execute()

        # Send notification to claimant
        client.table('notifications').insert({
            'user_id': user['userId'],
            'title': 'Claim Recorded',
            'message': f"Your claim for item '{item_res.data['item_name']}' has been registered and is under review.",
            'notification_type': 'claim_submitted'
        }).execute()

        return jsonify({'message': 'Ownership claim submitted successfully', 'claim': created_claim}), 201
    except Exception as e:
        print(f"[Claim Error]: {e}")
        return jsonify({'error': f'Failed to submit claim: {str(e)}'}), 500

@claim_bp.route('/my', methods=['GET'])
@token_required
def get_my_claims():
    client = get_supabase_client()
    if not client:
        return db_error_response()

    user = g.current_user
    try:
        res = client.table('claims').select('*, items(*)').eq('claimant_id', user['userId']).order('created_at', desc=True).execute()
        formatted_claims = []
        for c in (res.data or []):
            item = c.get('items') or {}
            c_copy = dict(c)
            c_copy['item_name'] = item.get('item_name', 'Unknown Item')
            c_copy['item_category'] = item.get('category', '')
            c_copy['item_image'] = item.get('image_url', '')
            c_copy['item_location'] = item.get('location', '')
            c_copy['item_status'] = item.get('status', '')
            formatted_claims.append(c_copy)
        return jsonify({'claims': formatted_claims})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@claim_bp.route('/<claim_id>', methods=['GET'])
@token_required
def get_claim_detail(claim_id):
    client = get_supabase_client()
    if not client:
        return db_error_response()

    user = g.current_user
    try:
        res = client.table('claims').select('*, items(*), profiles(*)').eq('id', claim_id).single().execute()
        if not res.data:
            return jsonify({'error': 'Claim not found'}), 404

        if user.get('role') != 'admin' and res.data['claimant_id'] != user['userId']:
            return jsonify({'error': 'Unauthorized to view this claim'}), 403

        return jsonify({'claim': res.data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

