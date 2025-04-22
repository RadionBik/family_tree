from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy instance
# This will be configured within the Flask app factory
db = SQLAlchemy()

def init_db(app):
    """Initialize the database with the Flask app context."""
    db.init_app(app)
    with app.app_context():
        # Create tables if they don't exist
        # In a real application, consider using migrations (e.g., Flask-Migrate)
        db.create_all()
        app.logger.info("Database tables checked/created.")

# You can add common database utility functions here later if needed
# For example:
# def save(model_instance):
#     db.session.add(model_instance)
#     db.session.commit()
#
# def delete(model_instance):
#     db.session.delete(model_instance)
#     db.session.commit()