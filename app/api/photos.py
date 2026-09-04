"""Portrait upload and delivery. Files live next to the database, one per person."""

import io

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_active_user, require_editor
from app.models.admin_user import AdminUser
from app.schemas.family import FamilyMemberRead, MemberUpdate
from app.services import edit_service
from app.utils.database import PHOTOS_DIR, get_db_session
from app.utils.localization import get_text

router = APIRouter()
MAX_SIDE = 1600
MAX_UPLOAD = 15 * 1024 * 1024


@router.post("/family/members/{member_id}/photo", response_model=FamilyMemberRead)
async def upload_photo(
    member_id: str,
    file: UploadFile,
    db: AsyncSession = Depends(get_db_session),
    user: AdminUser = Depends(require_editor),
):
    member = await edit_service.get_member(db, member_id)
    raw = await file.read(MAX_UPLOAD + 1)
    if len(raw) > MAX_UPLOAD:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=get_text("photo_too_large")
        )
    try:
        image = ImageOps.exif_transpose(Image.open(io.BytesIO(raw)))
    except UnidentifiedImageError:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail=get_text("photo_not_image")
        )
    image = image.convert("RGB")
    image.thumbnail((MAX_SIDE, MAX_SIDE))
    PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
    path = PHOTOS_DIR / f"{member.id}.jpg"
    image.save(path, "JPEG", quality=85, optimize=True)
    # The mtime query string busts browser caches after a re-upload.
    url = f"/api/photos/{path.name}?v={int(path.stat().st_mtime)}"
    return await edit_service.update_member(
        db, member.id, MemberUpdate(photo_url=url), author=user.username
    )


@router.get("/photos/{name}")
async def get_photo(name: str, _: AdminUser = Depends(get_current_active_user)):
    path = PHOTOS_DIR / name
    if "/" in name or not path.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=get_text("not_found"))
    return FileResponse(
        path,
        media_type="image/jpeg",
        headers={"Cache-Control": "private, max-age=86400"},
    )
