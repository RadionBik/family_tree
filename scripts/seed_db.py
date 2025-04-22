import asyncio
import logging
from datetime import date
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

# Adjust import paths based on running the script from the project root
from app.models import FamilyMember, Relation
from app.utils.database import DATABASE_URL, Base # Import Base from database utils
from app.models.family_member import GenderEnum # Import the implemented GenderEnum
from app.models.relation import RelationTypeEnum # Import the implemented RelationTypeEnum

# Configure logging for the script
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def seed_data():
    """Connects to the DB and inserts sample family data."""
    if not DATABASE_URL:
        logger.error("DATABASE_URL is not set. Cannot connect to the database.")
        return

    logger.info(f"Connecting to database: {DATABASE_URL}")
    # Use 'future=True' for SQLAlchemy 2.0 style execution
    engine = create_async_engine(DATABASE_URL, echo=False, future=True)

    # Optional: Drop and recreate tables for a clean seed (Use with caution!)
    # Commented out after initial seeding to prevent data loss
    # async with engine.begin() as conn:
    #     logger.warning("Dropping all tables...")
    #     await conn.run_sync(Base.metadata.drop_all)
    #     logger.warning("Creating all tables...")
    #     await conn.run_sync(Base.metadata.create_all)
    #     logger.info("Tables recreated.")

    # Create a sessionmaker bound to the engine
    async_session = sessionmaker(
        engine, expire_on_commit=False, class_=AsyncSession
    )

    async with async_session() as session:
        async with session.begin():
            logger.info("Checking for existing data...")
            # Simple check: if any family member exists, assume DB is seeded
            result = await session.execute(select(FamilyMember).limit(1))
            if result.scalars().first():
                logger.info("Database already contains data. Skipping seeding.")
                return

            logger.info("Seeding database with sample data...")

            # --- Create Family Members ---
            # Generation 1
            grandpa_john = FamilyMember(name="John Doe", gender=GenderEnum.MALE, birth_date=date(1940, 5, 15), death_date=date(2010, 10, 20), notes="Family patriarch")
            grandma_jane = FamilyMember(name="Jane Smith", gender=GenderEnum.FEMALE, birth_date=date(1942, 8, 25), notes="Family matriarch")

            # Generation 2
            dad_peter = FamilyMember(name="Peter Doe", gender=GenderEnum.MALE, birth_date=date(1965, 3, 10))
            mom_lisa = FamilyMember(name="Lisa Green", gender=GenderEnum.FEMALE, birth_date=date(1968, 7, 1))
            uncle_bob = FamilyMember(name="Bob Doe", gender=GenderEnum.MALE, birth_date=date(1967, 11, 5))

            # Generation 3
            son_chris = FamilyMember(name="Chris Doe", gender=GenderEnum.MALE, birth_date=date(1995, 1, 20))
            daughter_anna = FamilyMember(name="Anna Doe", gender=GenderEnum.FEMALE, birth_date=date(1998, 6, 12))

            members = [
                grandpa_john, grandma_jane, dad_peter, mom_lisa, uncle_bob, son_chris, daughter_anna
            ]
            session.add_all(members)
            await session.flush() # Flush to get IDs for relationships

            logger.info(f"Added {len(members)} family members.")

            # --- Create Relationships ---
            relations = [
                # Gen 1 Spouses
                Relation(from_member_id=grandpa_john.id, to_member_id=grandma_jane.id, relation_type=RelationTypeEnum.SPOUSE),
                # Gen 1 -> Gen 2 Parents
                Relation(from_member_id=grandpa_john.id, to_member_id=dad_peter.id, relation_type=RelationTypeEnum.PARENT),
                Relation(from_member_id=grandma_jane.id, to_member_id=dad_peter.id, relation_type=RelationTypeEnum.PARENT),
                Relation(from_member_id=grandpa_john.id, to_member_id=uncle_bob.id, relation_type=RelationTypeEnum.PARENT),
                Relation(from_member_id=grandma_jane.id, to_member_id=uncle_bob.id, relation_type=RelationTypeEnum.PARENT),
                # Gen 2 Spouses
                Relation(from_member_id=dad_peter.id, to_member_id=mom_lisa.id, relation_type=RelationTypeEnum.SPOUSE),
                 # Gen 2 -> Gen 3 Parents
                Relation(from_member_id=dad_peter.id, to_member_id=son_chris.id, relation_type=RelationTypeEnum.PARENT),
                Relation(from_member_id=mom_lisa.id, to_member_id=son_chris.id, relation_type=RelationTypeEnum.PARENT),
                Relation(from_member_id=dad_peter.id, to_member_id=daughter_anna.id, relation_type=RelationTypeEnum.PARENT),
                Relation(from_member_id=mom_lisa.id, to_member_id=daughter_anna.id, relation_type=RelationTypeEnum.PARENT),
            ]

            # Add reverse relationships automatically if needed (e.g., CHILD)
            reverse_relations = []
            for rel in relations:
                if rel.relation_type == RelationTypeEnum.PARENT:
                    reverse_relations.append(Relation(from_member_id=rel.to_member_id, to_member_id=rel.from_member_id, relation_type=RelationTypeEnum.CHILD))
                elif rel.relation_type == RelationTypeEnum.SPOUSE:
                     # Add spouse relationship in the other direction too for completeness
                    reverse_relations.append(Relation(from_member_id=rel.to_member_id, to_member_id=rel.from_member_id, relation_type=RelationTypeEnum.SPOUSE))
                # Add other reverse types if necessary (e.g., SIBLING)

            all_relations = relations + reverse_relations
            session.add_all(all_relations)
            await session.flush()

            logger.info(f"Added {len(all_relations)} relationships.")
            logger.info("Database seeding completed successfully.")

    # Dispose of the engine
    await engine.dispose()
    logger.info("Database connection closed.")

if __name__ == "__main__":
    # Ensure the script can find the 'app' module when run directly
    # This might require setting PYTHONPATH=. or running as python -m scripts.seed_db
    import sys
    import os
    # Add project root to path if necessary
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

    asyncio.run(seed_data())