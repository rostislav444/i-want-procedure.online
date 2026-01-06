import os
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File, status

from app.api.deps import CurrentUser
from app.core.config import settings

router = APIRouter(prefix="/uploads")

# Allowed image extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# Upload directory
UPLOAD_DIR = Path(settings.BASE_DIR) / "static" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def validate_image(file: UploadFile) -> None:
    """Validate uploaded file is an allowed image type and size"""
    # Check extension
    ext = Path(file.filename).suffix.lower() if file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}",
        )


def generate_unique_filename(original_filename: str, prefix: str) -> str:
    """Generate unique filename preserving extension"""
    ext = Path(original_filename).suffix.lower() if original_filename else ".jpg"
    unique_id = uuid.uuid4().hex[:12]
    return f"{prefix}_{unique_id}{ext}"


async def save_upload(file: UploadFile, subdirectory: str, prefix: str) -> str:
    """Save uploaded file and return URL path"""
    validate_image(file)

    # Create subdirectory if needed
    save_dir = UPLOAD_DIR / subdirectory
    save_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    filename = generate_unique_filename(file.filename or "image.jpg", prefix)
    file_path = save_dir / filename

    # Read and validate size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // 1024 // 1024}MB",
        )

    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)

    # Return URL path (relative to static)
    return f"/static/uploads/{subdirectory}/{filename}"


@router.post("/logo")
async def upload_logo(
    current_user: CurrentUser,
    file: UploadFile = File(...),
):
    """Upload company logo image"""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You don't have a company yet",
        )

    url = await save_upload(file, "logos", f"logo_{current_user.company_id}")
    return {"url": url}


@router.post("/cover")
async def upload_cover(
    current_user: CurrentUser,
    file: UploadFile = File(...),
):
    """Upload company cover image"""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You don't have a company yet",
        )

    url = await save_upload(file, "covers", f"cover_{current_user.company_id}")
    return {"url": url}
