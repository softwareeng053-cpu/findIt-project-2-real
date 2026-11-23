import os
from flask import Flask, jsonify
from flask_cors import CORS
from backend.config import config_by_name

def create_app(config_name=None):
    if not config_name:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name['default']))

    # Configure CORS
    CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)

    # Register Blueprints
    from backend.app.routes.auth_routes import auth_bp
    from backend.app.routes.item_routes import item_bp
    from backend.app.routes.claim_routes import claim_bp
    from backend.app.routes.notification_routes import notification_bp
    from backend.app.routes.admin_routes import admin_bp
    from backend.app.routes.public_routes import public_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(item_bp)
    app.register_blueprint(claim_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(public_bp)


    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'system': 'Findlt Campus Lost & Found REST API',
            'version': '1.0.0'
        }), 200

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500

    return app
