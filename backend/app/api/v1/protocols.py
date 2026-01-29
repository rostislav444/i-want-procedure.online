"""API endpoints for procedure protocols."""
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.core.config import settings
from app.models.appointment import Appointment
from app.models.procedure_protocol import ProcedureProtocol, ProtocolProduct
from app.models.protocol_template import ProtocolTemplate
from app.models.protocol_file import ProtocolFile
from app.schemas.procedure_protocol import (
    ProcedureProtocolCreate,
    ProcedureProtocolUpdate,
    ProcedureProtocolResponse,
    ProtocolProductCreate,
    ProtocolProductResponse,
)
from app.schemas.protocol_file import (
    ProtocolFileResponse,
    ProtocolFileAttach,
    ProtocolFileUpdate,
)

router = APIRouter(prefix="/protocols")


@router.get("/appointment/{appointment_id}", response_model=ProcedureProtocolResponse)
async def get_protocol_by_appointment(
    appointment_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Get protocol for a specific appointment."""
    # First verify the appointment belongs to user's company
    appointment_result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.company_id == current_user.company_id,
        )
    )
    if not appointment_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    result = await db.execute(
        select(ProcedureProtocol)
        .options(
            selectinload(ProcedureProtocol.products_used),
            selectinload(ProcedureProtocol.template),
        )
        .where(ProcedureProtocol.appointment_id == appointment_id)
    )
    protocol = result.scalar_one_or_none()
    if not protocol:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Protocol not found for this appointment",
        )
    return protocol


@router.post("", response_model=ProcedureProtocolResponse, status_code=status.HTTP_201_CREATED)
async def create_protocol(
    protocol_data: ProcedureProtocolCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Create a new procedure protocol."""
    # Verify appointment belongs to user's company
    appointment_result = await db.execute(
        select(Appointment).where(
            Appointment.id == protocol_data.appointment_id,
            Appointment.company_id == current_user.company_id,
        )
    )
    appointment = appointment_result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    # Check if protocol already exists
    existing_result = await db.execute(
        select(ProcedureProtocol).where(
            ProcedureProtocol.appointment_id == protocol_data.appointment_id
        )
    )
    if existing_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Protocol already exists for this appointment",
        )

    # Verify template if provided
    if protocol_data.template_id:
        template_result = await db.execute(
            select(ProtocolTemplate).where(
                ProtocolTemplate.id == protocol_data.template_id,
                (ProtocolTemplate.company_id == current_user.company_id) | (ProtocolTemplate.company_id.is_(None)),
            )
        )
        if not template_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found",
            )

    # Create protocol
    protocol = ProcedureProtocol(
        appointment_id=protocol_data.appointment_id,
        specialist_id=current_user.id,
        template_id=protocol_data.template_id,
        template_data=protocol_data.template_data or {},
        skin_condition=protocol_data.skin_condition,
        complaints=protocol_data.complaints,
        procedure_notes=protocol_data.procedure_notes,
        technique_used=protocol_data.technique_used,
        results=protocol_data.results,
        recommendations=protocol_data.recommendations,
        next_visit_notes=protocol_data.next_visit_notes,
        photos_before=protocol_data.photos_before or [],
        photos_after=protocol_data.photos_after or [],
    )
    db.add(protocol)
    await db.flush()

    # Add products if provided
    if protocol_data.products_used:
        for product_data in protocol_data.products_used:
            product = ProtocolProduct(
                protocol_id=protocol.id,
                name=product_data.name,
                manufacturer=product_data.manufacturer,
                quantity=product_data.quantity,
                batch_number=product_data.batch_number,
                notes=product_data.notes,
            )
            db.add(product)

    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(ProcedureProtocol)
        .options(
            selectinload(ProcedureProtocol.products_used),
            selectinload(ProcedureProtocol.template),
        )
        .where(ProcedureProtocol.id == protocol.id)
    )
    return result.scalar_one()


@router.patch("/{protocol_id}", response_model=ProcedureProtocolResponse)
async def update_protocol(
    protocol_id: int,
    protocol_data: ProcedureProtocolUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Update an existing protocol."""
    result = await db.execute(
        select(ProcedureProtocol)
        .options(
            selectinload(ProcedureProtocol.products_used),
            selectinload(ProcedureProtocol.template),
        )
        .join(Appointment)
        .where(
            ProcedureProtocol.id == protocol_id,
            Appointment.company_id == current_user.company_id,
        )
    )
    protocol = result.scalar_one_or_none()
    if not protocol:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Protocol not found",
        )

    # Verify template if being changed
    if protocol_data.template_id is not None:
        template_result = await db.execute(
            select(ProtocolTemplate).where(
                ProtocolTemplate.id == protocol_data.template_id,
                (ProtocolTemplate.company_id == current_user.company_id) | (ProtocolTemplate.company_id.is_(None)),
            )
        )
        if not template_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found",
            )

    update_data = protocol_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(protocol, field, value)

    await db.commit()

    # Reload with template relationship
    result = await db.execute(
        select(ProcedureProtocol)
        .options(
            selectinload(ProcedureProtocol.products_used),
            selectinload(ProcedureProtocol.template),
        )
        .where(ProcedureProtocol.id == protocol_id)
    )
    return result.scalar_one()


@router.delete("/{protocol_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_protocol(
    protocol_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Delete a protocol."""
    result = await db.execute(
        select(ProcedureProtocol)
        .join(Appointment)
        .where(
            ProcedureProtocol.id == protocol_id,
            Appointment.company_id == current_user.company_id,
        )
    )
    protocol = result.scalar_one_or_none()
    if not protocol:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Protocol not found",
        )

    await db.delete(protocol)
    await db.commit()


# Products management
@router.post("/{protocol_id}/products", response_model=ProtocolProductResponse, status_code=status.HTTP_201_CREATED)
async def add_product_to_protocol(
    protocol_id: int,
    product_data: ProtocolProductCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Add a product to a protocol."""
    # Verify protocol access
    result = await db.execute(
        select(ProcedureProtocol)
        .join(Appointment)
        .where(
            ProcedureProtocol.id == protocol_id,
            Appointment.company_id == current_user.company_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Protocol not found",
        )

    product = ProtocolProduct(
        protocol_id=protocol_id,
        name=product_data.name,
        manufacturer=product_data.manufacturer,
        quantity=product_data.quantity,
        batch_number=product_data.batch_number,
        notes=product_data.notes,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/{protocol_id}/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_product_from_protocol(
    protocol_id: int,
    product_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Remove a product from a protocol."""
    result = await db.execute(
        select(ProtocolProduct)
        .join(ProcedureProtocol)
        .join(Appointment)
        .where(
            ProtocolProduct.id == product_id,
            ProtocolProduct.protocol_id == protocol_id,
            Appointment.company_id == current_user.company_id,
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    await db.delete(product)
    await db.commit()


# Get protocols for a client
@router.get("/client/{client_id}", response_model=list[ProcedureProtocolResponse])
async def get_client_protocols(
    client_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Get all protocols for a client."""
    result = await db.execute(
        select(ProcedureProtocol)
        .options(
            selectinload(ProcedureProtocol.products_used),
            selectinload(ProcedureProtocol.template),
        )
        .join(Appointment)
        .where(
            Appointment.client_id == client_id,
            Appointment.company_id == current_user.company_id,
        )
        .order_by(ProcedureProtocol.created_at.desc())
    )
    return result.scalars().all()


# Files management
@router.get("/{protocol_id}/files", response_model=list[ProtocolFileResponse])
async def get_protocol_files(
    protocol_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Get all files for a protocol."""
    # Verify protocol access
    protocol_result = await db.execute(
        select(ProcedureProtocol)
        .join(Appointment)
        .where(
            ProcedureProtocol.id == protocol_id,
            Appointment.company_id == current_user.company_id,
        )
    )
    if not protocol_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Protocol not found",
        )

    result = await db.execute(
        select(ProtocolFile)
        .where(ProtocolFile.protocol_id == protocol_id)
        .order_by(ProtocolFile.file_type, ProtocolFile.created_at)
    )
    return result.scalars().all()


@router.post("/{protocol_id}/files/attach", response_model=list[ProtocolFileResponse])
async def attach_files_to_protocol(
    protocol_id: int,
    attach_data: ProtocolFileAttach,
    current_user: CurrentUser,
    db: DbSession,
):
    """Attach uploaded files to a protocol."""
    # Verify protocol access
    protocol_result = await db.execute(
        select(ProcedureProtocol)
        .join(Appointment)
        .where(
            ProcedureProtocol.id == protocol_id,
            Appointment.company_id == current_user.company_id,
        )
    )
    if not protocol_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Protocol not found",
        )

    # Get files and verify ownership
    files_result = await db.execute(
        select(ProtocolFile)
        .where(
            ProtocolFile.id.in_(attach_data.file_ids),
            ProtocolFile.company_id == current_user.company_id,
            ProtocolFile.protocol_id.is_(None),  # Only unattached files
        )
    )
    files = files_result.scalars().all()

    if len(files) != len(attach_data.file_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Some files not found or already attached",
        )

    # Attach files to protocol
    for file in files:
        file.protocol_id = protocol_id

    await db.commit()

    # Return all protocol files
    result = await db.execute(
        select(ProtocolFile)
        .where(ProtocolFile.protocol_id == protocol_id)
        .order_by(ProtocolFile.file_type, ProtocolFile.created_at)
    )
    return result.scalars().all()


@router.delete("/{protocol_id}/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_protocol_file(
    protocol_id: int,
    file_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Delete a file from a protocol."""
    result = await db.execute(
        select(ProtocolFile)
        .where(
            ProtocolFile.id == file_id,
            ProtocolFile.protocol_id == protocol_id,
            ProtocolFile.company_id == current_user.company_id,
        )
    )
    file = result.scalar_one_or_none()
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    # Delete physical file
    file_path = Path(settings.BASE_DIR) / file.file_path.lstrip("/")
    if file_path.exists():
        os.remove(file_path)

    # Delete database record
    await db.delete(file)
    await db.commit()


@router.patch("/files/{file_id}", response_model=ProtocolFileResponse)
async def update_protocol_file(
    file_id: int,
    file_data: ProtocolFileUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Update a protocol file (e.g., toggle show_in_portfolio)."""
    result = await db.execute(
        select(ProtocolFile)
        .where(
            ProtocolFile.id == file_id,
            ProtocolFile.company_id == current_user.company_id,
        )
    )
    file = result.scalar_one_or_none()
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    update_data = file_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(file, field, value)

    await db.commit()
    await db.refresh(file)
    return file


@router.get("/files/unattached", response_model=list[ProtocolFileResponse])
async def get_unattached_files(
    current_user: CurrentUser,
    db: DbSession,
):
    """Get all unattached files for the current user's company.

    These are files that were uploaded but not yet attached to any protocol.
    """
    result = await db.execute(
        select(ProtocolFile)
        .where(
            ProtocolFile.company_id == current_user.company_id,
            ProtocolFile.protocol_id.is_(None),
        )
        .order_by(ProtocolFile.created_at.desc())
    )
    return result.scalars().all()


@router.delete("/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_unattached_file(
    file_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Delete an unattached file."""
    result = await db.execute(
        select(ProtocolFile)
        .where(
            ProtocolFile.id == file_id,
            ProtocolFile.company_id == current_user.company_id,
            ProtocolFile.protocol_id.is_(None),  # Only unattached
        )
    )
    file = result.scalar_one_or_none()
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or already attached to a protocol",
        )

    # Delete physical file
    file_path = Path(settings.BASE_DIR) / file.file_path.lstrip("/")
    if file_path.exists():
        os.remove(file_path)

    # Delete database record
    await db.delete(file)
    await db.commit()
