import os
import uuid
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, HTTPException, UploadFile, File, status, Form

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.models.protocol_file import ProtocolFile
from app.schemas.protocol_file import ProtocolFileUploadResponse

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


async def save_upload_with_info(
    file: UploadFile, subdirectory: str, prefix: str
) -> tuple[str, str, int, str]:
    """Save uploaded file and return (url, filename, size, mime_type)"""
    validate_image(file)

    # Create subdirectory if needed
    save_dir = UPLOAD_DIR / subdirectory
    save_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    filename = generate_unique_filename(file.filename or "image.jpg", prefix)
    file_path = save_dir / filename

    # Read and validate size
    contents = await file.read()
    file_size = len(contents)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // 1024 // 1024}MB",
        )

    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)

    # Get mime type
    mime_type = file.content_type or "image/jpeg"

    # Return URL path and metadata
    url = f"/static/uploads/{subdirectory}/{filename}"
    return url, filename, file_size, mime_type


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


@router.post("/protocol-photo", response_model=ProtocolFileUploadResponse)
async def upload_protocol_photo(
    current_user: CurrentUser,
    db: DbSession,
    file: UploadFile = File(...),
    file_type: Literal["before", "after"] = Form(...),
):
    """Upload a protocol photo (before or after procedure).

    The file is saved and a ProtocolFile record is created.
    The file can be attached to a protocol later using the protocol_id.
    """
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You don't have a company yet",
        )

    # Save file to disk
    url, filename, file_size, mime_type = await save_upload_with_info(
        file,
        "protocol-photos",
        f"protocol_{current_user.company_id}_{file_type}"
    )

    # Create database record
    protocol_file = ProtocolFile(
        protocol_id=None,  # Will be attached later
        company_id=current_user.company_id,
        file_type=file_type,
        filename=filename,
        original_filename=file.filename or "image.jpg",
        file_path=url,
        file_size=file_size,
        mime_type=mime_type,
        uploaded_by=current_user.id,
    )
    db.add(protocol_file)
    await db.commit()
    await db.refresh(protocol_file)

    return protocol_file
