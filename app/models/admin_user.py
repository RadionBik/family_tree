from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app.utils.database import db

class AdminUser(db.Model):
    __tablename__ = 'admin_users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False) # Increased length for stronger hashes
    role = db.Column(db.String(50), default='admin', nullable=False) # e.g., 'admin', 'editor'
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self, password):
        """Hashes the password and stores the hash."""
        self.password_hash = generate_password_hash(password)

    def verify_password(self, password):
        """Verifies the provided password against the stored hash."""
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<AdminUser {self.username} ({self.role})>'

    # Add validation for email format if needed
    # def validate_email(self):
    #     # ... (similar to SubscribedEmail)
    #     pass