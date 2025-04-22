import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask
from config import config
from .utils.database import init_db # Import init_db

# Basic logging setup
if not os.path.exists('logs'):
    os.mkdir('logs')
file_handler = RotatingFileHandler('logs/family_tree.log', maxBytes=10240, backupCount=10)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
file_handler.setLevel(logging.INFO)

stream_handler = logging.StreamHandler()
stream_handler.setLevel(logging.INFO)

logging.basicConfig(level=logging.INFO, handlers=[file_handler, stream_handler])

def create_app(config_name='default'):
    """Flask application factory."""
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize database
    init_db(app)

    # Configure logging based on environment
    if app.config.get('LOG_TO_STDOUT'):
        stream_handler = logging.StreamHandler()
        stream_handler.setLevel(logging.INFO)
        app.logger.addHandler(stream_handler)
    else:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        file_handler = RotatingFileHandler('logs/family_tree.log', maxBytes=10240, backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)

    app.logger.setLevel(logging.INFO)
    app.logger.info('Family Tree application startup')

    # Register blueprints, extensions, etc. here
    # from .api import api as api_blueprint
    # app.register_blueprint(api_blueprint, url_prefix='/api/v1')

    @app.route('/')
    def index():
        app.logger.info('Accessed index route')
        return "Hello, Family Tree!"

    return app

if __name__ == '__main__':
    # This allows running the app directly for development
    # Use a proper WSGI server like Gunicorn in production
    app_env = os.environ.get('FLASK_CONFIG') or 'default'
    app = create_app(app_env)
    app.run(debug=app.config['DEBUG'])