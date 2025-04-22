from datetime import datetime
from app.utils.database import db

class SubscribedEmail(db.Model):
    __tablename__ = 'subscribed_emails'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    subscription_date = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        status = 'Active' if self.is_active else 'Inactive'
        return f'<SubscribedEmail {self.email} ({status})>'

    # Add validation for email format if needed using libraries like email_validator
    # def validate_email(self):
    #     from email_validator import validate_email, EmailNotValidError
    #     try:
    #         validate_email(self.email)
    #     except EmailNotValidError as e:
    #         raise ValueError(str(e))