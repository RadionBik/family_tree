# Import all models here so that Base knows about them
# This is crucial for SQLAlchemy's metadata collection (e.g., for table creation)

from .admin_user import AdminUser
from .change import Change
from .family_member import FamilyMember
from .relation import Relation
from .subscribed_email import SubscribedEmail

# You can optionally define __all__ to control what 'from app.models import *' imports
__all__ = [
    "Change",
    "FamilyMember",
    "Relation",
    "SubscribedEmail",
    "AdminUser",
]
