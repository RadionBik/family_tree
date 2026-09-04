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
from PIL import Image  # noqa: E402

from app.main import app  # noqa: E402
from app.models import AdminUser, FamilyMember, Relation  # noqa: E402
from app.models.relation import RelationTypeEnum  # noqa: E402
from app.utils.database import AsyncSessionFactory, Base, async_engine  # noqa: E402
from run_scheduler import load_state, save_state  # noqa: E402
from scripts.backup_db import backup_database  # noqa: E402
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


def _login(client, username, password="pw"):
    r = client.post(
        "/api/auth/login", data={"username": username, "password": password}
    )
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_api():
    asyncio.run(_seed())
    client = TestClient(app, raise_server_exceptions=False)

    # access rules
    assert client.get("/").status_code == 200  # health check stays open
    for path in ("/api/family/tree", "/api/upcoming-birthdays", "/api/changes"):
        assert client.get(path).status_code == 401, path
    viewer = _login(client, "viewer")
    admin = _login(client, "admin")
    assert {m["id"] for m in client.get("/api/family/tree", headers=viewer).json()} == {
        "m1",
        "m2",
    }
    assert client.get("/api/upcoming-birthdays", headers=viewer).status_code == 200
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

    # write path: editors only, every change logged with its author
    person = {"first_name": "Test", "last_name": "Person", "birth_date": "1990-05-05"}
    assert (
        client.post("/api/family/members", json=person, headers=viewer).status_code
        == 403
    )
    created = client.post("/api/family/members", json=person, headers=admin)
    assert created.status_code == 201, created.text
    pid = created.json()["id"]
    r = client.patch(
        f"/api/family/members/{pid}", json={"birth_date": "1990-05-06"}, headers=admin
    )
    assert r.status_code == 200 and r.json()["birth_date"] == "1990-05-06"
    rel = client.post(
        "/api/family/relations",
        json={"from_member_id": pid, "to_member_id": "m1", "relation_type": "SPOUSE"},
        headers=admin,
    )
    assert rel.status_code == 201, rel.text
    pair = (rel.json()["from_member_id"], rel.json()["to_member_id"])
    assert pair == tuple(sorted([pid, "m1"]))  # spouse pair stored in id order
    dup = client.post(
        "/api/family/relations",
        json={"from_member_id": "m1", "to_member_id": pid, "relation_type": "SPOUSE"},
        headers=admin,
    )
    assert dup.status_code == 409
    kinds = [
        (c["entity"], c["kind"], c["field"], c["author"])
        for c in client.get("/api/changes", headers=viewer).json()
    ]
    assert ("member", "added", None, "admin") in kinds
    assert ("member", "changed", "birth_date", "admin") in kinds
    assert ("relation", "added", None, "admin") in kinds
    assert (
        client.delete(
            f"/api/family/relations/{rel.json()['id']}", headers=admin
        ).status_code
        == 204
    )
    assert client.delete(f"/api/family/members/{pid}", headers=admin).status_code == 204
    assert client.delete(f"/api/family/members/{pid}", headers=admin).status_code == 404
    assert pid not in {
        m["id"] for m in client.get("/api/family/tree", headers=viewer).json()
    }

    # invites: admin creates a link, a relative turns it into an editor login
    assert client.post("/api/invites", headers=viewer).status_code == 403
    inv = client.post("/api/invites", headers=admin)
    assert inv.status_code == 201, inv.text
    token = inv.json()["token"]
    assert client.get(f"/api/invites/{token}").status_code == 200
    assert (
        client.post(
            f"/api/invites/{token}/accept",
            json={"username": "cousin", "password": "short"},
        ).status_code
        == 422
    )
    acc = client.post(
        f"/api/invites/{token}/accept",
        json={"username": "cousin", "password": "longenough1"},
    )
    assert acc.status_code == 200, acc.text
    assert client.get(f"/api/invites/{token}").status_code == 404  # single use
    editor = {"Authorization": f"Bearer {acc.json()['access_token']}"}
    assert client.get("/api/auth/me", headers=editor).json()["role"] == "editor"
    assert (
        client.patch(
            "/api/family/members/m2", json={"location": "Казань"}, headers=editor
        ).status_code
        == 200
    )
    assert client.post("/api/invites", headers=editor).status_code == 403
    assert client.get("/api/changes", headers=viewer).json()[0]["author"] == "cousin"

    # photo upload: resized, stored next to the db, served only with a token
    buf = io.BytesIO()
    Image.new("RGB", (4000, 2400), "red").save(buf, "PNG")
    up = client.post(
        "/api/family/members/m2/photo",
        files={"file": ("me.png", buf.getvalue(), "image/png")},
        headers=editor,
    )
    assert up.status_code == 200, up.text
    photo_url = up.json()["photo_url"]
    assert photo_url.startswith("/api/photos/m2.jpg")
    assert TestClient(app).get(photo_url).status_code == 401  # no token, no cookie
    assert client.get(photo_url).status_code == 200  # login cookie alone, like an <img>
    got = client.get(photo_url, headers=viewer)
    assert got.status_code == 200 and got.headers["content-type"] == "image/jpeg"
    assert max(Image.open(io.BytesIO(got.content)).size) == 1600

    # backup and scheduler state live next to the database
    backup = backup_database()
    assert backup.exists() and backup.stat().st_size > 0
    save_state({"birthdays": "2026-01-01"})
    assert load_state() == {"birthdays": "2026-01-01"}


if __name__ == "__main__":
    test_parse_rows_dedupes_spouses_and_skips_unknown_ids()
    test_api()
    print("smoke ok")
