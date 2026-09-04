"""Smoke checks. Run: `python -m tests.test_smoke` (or pytest). Temp SQLite, no network."""

import asyncio
import csv
import io
import os
import tempfile

os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"
os.environ["JWT_SECRET_KEY"] = "test-secret"
os.environ["APP_ENV"] = "development"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.models import AdminUser, FamilyMember, Relation  # noqa: E402
from app.models.relation import RelationTypeEnum  # noqa: E402
from app.utils.database import AsyncSessionFactory, Base, async_engine  # noqa: E402
from scripts.data_utils import parse_rows  # noqa: E402

SHEET = """id,first_name,last_name,birth_date,gender,mother_id,father_id,spouse_id,marriage_date,photo_url,telegram
a,Anna,Ivanova,1950-02-01,female,,,b,1972-06-10,https://x/a.jpg,@anna
b,Boris,Ivanov,1948-05-09,male,,,a,,,
c,Chris,Ivanov,1975-12-24,unicorn,a,b,,,,
d,Dima,Ivanov,,,a,zzz,,,,
"""


def test_parse_rows_dedupes_spouses_and_skips_unknown_ids():
    members, relations = parse_rows(csv.DictReader(io.StringIO(SHEET)))
    assert [m.id for m in members] == ["a", "b", "c", "d"]
    assert members[2].gender is None  # bad value tolerated
    assert (members[0].photo_url, members[0].telegram) == ("https://x/a.jpg", "@anna")
    assert members[1].photo_url is None
    marriage = next(r for r in relations if r.relation_type is RelationTypeEnum.SPOUSE)
    assert str(marriage.start_date) == "1972-06-10"
    edges = {(r.relation_type, r.from_member_id, r.to_member_id) for r in relations}
    assert edges == {
        (RelationTypeEnum.SPOUSE, "a", "b"),  # one edge, not two
        (RelationTypeEnum.PARENT, "a", "c"),
        (RelationTypeEnum.PARENT, "b", "c"),
        (RelationTypeEnum.PARENT, "a", "d"),  # "zzz" dropped
    }


async def _seed():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionFactory() as s:
        admin = AdminUser(username="admin", email="a@x.x", role="admin")
        admin.password = "pw"
        viewer = AdminUser(username="viewer", email="v@x.x", role="viewer")
        viewer.password = "pw"
        s.add_all(
            [
                admin,
                viewer,
                FamilyMember(id="m1", first_name="Ivan"),
                FamilyMember(id="m2", first_name="Anna"),
            ]
        )
        await s.flush()
        s.add(
            Relation(
                from_member_id="m1",
                to_member_id="m2",
                relation_type=RelationTypeEnum.SPOUSE,
            )
        )
        await s.commit()


def _login(client, username):
    r = client.post("/api/auth/login", data={"username": username, "password": "pw"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_api_access_rules():
    asyncio.run(_seed())
    client = TestClient(app, raise_server_exceptions=False)

    assert client.get("/").status_code == 200  # health check stays open
    for path in ("/api/family/tree", "/api/upcoming-birthdays"):
        assert client.get(path).status_code == 401, path
    assert client.post("/api/subscribe", json={"email": "x@x.x"}).status_code == 401

    viewer = _login(client, "viewer")
    tree = client.get("/api/family/tree", headers=viewer)
    assert tree.status_code == 200
    assert {m["id"] for m in tree.json()} == {"m1", "m2"}
    assert client.get("/api/upcoming-birthdays", headers=viewer).status_code == 200

    admin = _login(client, "admin")
    assert client.get("/api/auth/me", headers=admin).json()["role"] == "admin"

    assert (
        client.post(
            "/api/subscribe", json={"email": "New@x.x"}, headers=viewer
        ).status_code
        == 201
    )
    assert (
        client.post(
            "/api/subscribe", json={"email": "new@x.x"}, headers=viewer
        ).status_code
        == 409
    )


if __name__ == "__main__":
    test_parse_rows_dedupes_spouses_and_skips_unknown_ids()
    test_api_access_rules()
    print("smoke ok")
