from datetime import datetime
from app.utils.database import db

class Relation(db.Model):
    __tablename__ = 'relations'

    id = db.Column(db.Integer, primary_key=True)
    # Foreign key linking to the 'source' member of the relationship
    from_member_id = db.Column(db.Integer, db.ForeignKey('family_members.id'), nullable=False, index=True)
    # Foreign key linking to the 'target' member of the relationship
    to_member_id = db.Column(db.Integer, db.ForeignKey('family_members.id'), nullable=False, index=True)
    # Type of relationship (e.g., 'parent', 'child', 'spouse', 'sibling')
    relation_type = db.Column(db.String(50), nullable=False, index=True)
    start_date = db.Column(db.Date, nullable=True) # e.g., marriage date
    end_date = db.Column(db.Date, nullable=True)   # e.g., divorce date
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Define relationships to the FamilyMember model
    # Allows accessing the related FamilyMember objects directly
    from_member = db.relationship('FamilyMember', foreign_keys=[from_member_id], backref=db.backref('relationships_from', lazy='dynamic'))
    to_member = db.relationship('FamilyMember', foreign_keys=[to_member_id], backref=db.backref('relationships_to', lazy='dynamic'))

    # Ensure a unique combination of from, to, and type to avoid duplicate relationships
    __table_args__ = (db.UniqueConstraint('from_member_id', 'to_member_id', 'relation_type', name='_from_to_type_uc'),)

    def __repr__(self):
        return f'<Relation {self.from_member_id} -> {self.to_member_id} ({self.relation_type})>'

    # Add validation if needed
    # def validate_relation_type(self):
    #     allowed_types = ['parent', 'child', 'spouse', 'sibling'] # Example types
    #     if self.relation_type not in allowed_types:
    #         raise ValueError(f"Invalid relation type: {self.relation_type}")