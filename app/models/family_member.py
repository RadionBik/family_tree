from datetime import datetime
from app.utils.database import db

class FamilyMember(db.Model):
    __tablename__ = 'family_members'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, index=True)
    birth_date = db.Column(db.Date, nullable=True)
    death_date = db.Column(db.Date, nullable=True)
    gender = db.Column(db.String(10), nullable=True) # e.g., 'Male', 'Female', 'Other'
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships (defined later in Relation model using backref or similar)
    # relationships_from = db.relationship('Relation', foreign_keys='Relation.from_member_id', backref='from_member', lazy='dynamic')
    # relationships_to = db.relationship('Relation', foreign_keys='Relation.to_member_id', backref='to_member', lazy='dynamic')

    def __repr__(self):
        return f'<FamilyMember {self.name} (ID: {self.id})>'

    # Add data validation methods if needed
    # def validate_gender(self):
    #     allowed_genders = ['Male', 'Female', 'Other', None]
    #     if self.gender not in allowed_genders:
    #         raise ValueError(f"Invalid gender: {self.gender}")