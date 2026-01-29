"""Section templates API endpoints."""

import base64
import re
import json
from typing import Optional

from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.core.config import settings
from app.models.section_template import SectionTemplate
from app.prompts import (
    FULL_SITE_GENERATION_PROMPT,
    MASTER_PROMPT,
)
from app.schemas.section_template import (
    SectionTemplateCreate,
    SectionTemplateUpdate,
    SectionTemplateResponse,
    RenderTemplateRequest,
    RenderTemplateResponse,
)

router = APIRouter(prefix="/section-templates", tags=["section-templates"])


# ============= LANDING VERSION MANAGEMENT (must be before /{template_id} route!) =============

from pydantic import BaseModel
from app.models.company import Company
from app.models.company_member import CompanyMember
from app.models.landing_version import LandingVersion
from datetime import datetime


class ReferenceImageData(BaseModel):
    """Reference image stored as base64."""
    data: str  # base64 encoded image data (can be data URL or raw base64)
    media_type: Optional[str] = None  # e.g., "image/jpeg", "image/png"
    name: Optional[str] = None  # original filename


class SaveLandingRequest(BaseModel):
    """Request to save landing page HTML."""
    html: str
    prompt: Optional[str] = None
    had_reference_image: bool = False
    reference_images: Optional[list[ReferenceImageData]] = None


class SaveLandingResponse(BaseModel):
    """Response after saving landing page."""
    success: bool
    message: str
    version_id: int


class LandingVersionResponse(BaseModel):
    """Landing version data."""
    id: int
    html: str
    prompt: Optional[str]
    had_reference_image: bool
    reference_images: Optional[list[ReferenceImageData]] = None
    notes: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LandingVersionListItem(BaseModel):
    """Landing version list item (without full HTML)."""
    id: int
    prompt: Optional[str]
    had_reference_image: bool
    has_reference_images: bool = False  # Just a flag, not full data
    notes: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UpdateVersionNotesRequest(BaseModel):
    """Request to update version notes."""
    notes: str


async def get_user_company(db, current_user) -> tuple[CompanyMember, Company]:
    """Get user's company membership and company (must be owner or manager).

    Uses the selected company from X-Company-Id header if available,
    otherwise falls back to first company where user is owner/manager.
    """
    # Build base query
    query = select(CompanyMember).where(
        CompanyMember.user_id == current_user.id,
        CompanyMember.is_active == True,
        or_(CompanyMember.is_owner == True, CompanyMember.is_manager == True)
    )

    # If user has selected a specific company via X-Company-Id header, use it
    selected_company_id = getattr(current_user, '_selected_company_id', None)
    if selected_company_id:
        query = query.where(CompanyMember.company_id == selected_company_id)

    member_result = await db.execute(query)
    member = member_result.scalar_one_or_none()

    if not member:
        raise HTTPException(
            status_code=403,
            detail="You must be a company owner or manager to manage landing pages"
        )

    company_result = await db.execute(
        select(Company).where(Company.id == member.company_id)
    )
    company = company_result.scalar_one_or_none()

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    return member, company


@router.post("/save-landing", response_model=SaveLandingResponse)
async def save_landing(
    request: SaveLandingRequest,
    db: DbSession,
    current_user: CurrentUser,
):
    """Save generated landing page HTML to company and create a version."""
    member, company = await get_user_company(db, current_user)

    # Deactivate all existing versions
    existing_active = await db.execute(
        select(LandingVersion).where(
            LandingVersion.company_id == company.id,
            LandingVersion.is_active == True
        )
    )
    for version in existing_active.scalars():
        version.is_active = False

    # Convert reference images to JSON-serializable format
    reference_images_data = None
    if request.reference_images:
        reference_images_data = [
            {
                "data": img.data,
                "media_type": img.media_type,
                "name": img.name,
            }
            for img in request.reference_images
        ]

    # Create new version
    new_version = LandingVersion(
        company_id=company.id,
        html=request.html,
        prompt=request.prompt,
        had_reference_image=request.had_reference_image,
        reference_images=reference_images_data,
        is_active=True,
    )
    db.add(new_version)

    # Also update the company's landing_html
    company.landing_html = request.html
    await db.commit()
    await db.refresh(new_version)

    return SaveLandingResponse(
        success=True,
        message="Лендінг успішно збережено!",
        version_id=new_version.id,
    )


@router.get("/landing-versions", response_model=list[LandingVersionListItem])
async def list_landing_versions(
    db: DbSession,
    current_user: CurrentUser,
) -> list[LandingVersionListItem]:
    """List all landing page versions for user's company."""
    member, company = await get_user_company(db, current_user)

    result = await db.execute(
        select(LandingVersion)
        .where(LandingVersion.company_id == company.id)
        .order_by(LandingVersion.created_at.desc())
    )
    versions = result.scalars().all()

    # If no versions but company has landing_html, create initial version
    if not versions and company.landing_html:
        initial_version = LandingVersion(
            company_id=company.id,
            html=company.landing_html,
            prompt="Мігровано з попереднього збереження",
            had_reference_image=False,
            is_active=True,
        )
        db.add(initial_version)
        await db.commit()
        await db.refresh(initial_version)
        versions = [initial_version]

    return versions


@router.get("/landing-versions/{version_id}", response_model=LandingVersionResponse)
async def get_landing_version(
    version_id: int,
    db: DbSession,
    current_user: CurrentUser,
):
    """Get a specific landing page version."""
    member, company = await get_user_company(db, current_user)

    result = await db.execute(
        select(LandingVersion).where(
            LandingVersion.id == version_id,
            LandingVersion.company_id == company.id,
        )
    )
    version = result.scalar_one_or_none()

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    return version


@router.patch("/landing-versions/{version_id}/notes", response_model=LandingVersionResponse)
async def update_version_notes(
    version_id: int,
    request: UpdateVersionNotesRequest,
    db: DbSession,
    current_user: CurrentUser,
):
    """Update notes for a landing page version."""
    member, company = await get_user_company(db, current_user)

    result = await db.execute(
        select(LandingVersion).where(
            LandingVersion.id == version_id,
            LandingVersion.company_id == company.id,
        )
    )
    version = result.scalar_one_or_none()

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    version.notes = request.notes
    await db.commit()
    await db.refresh(version)

    return version


@router.post("/landing-versions/{version_id}/activate", response_model=LandingVersionResponse)
async def activate_version(
    version_id: int,
    db: DbSession,
    current_user: CurrentUser,
):
    """Activate a specific version (make it the current landing page)."""
    member, company = await get_user_company(db, current_user)

    # Get the version to activate
    result = await db.execute(
        select(LandingVersion).where(
            LandingVersion.id == version_id,
            LandingVersion.company_id == company.id,
        )
    )
    version = result.scalar_one_or_none()

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    # Deactivate all other versions
    all_versions_result = await db.execute(
        select(LandingVersion).where(
            LandingVersion.company_id == company.id,
            LandingVersion.is_active == True
        )
    )
    for v in all_versions_result.scalars():
        v.is_active = False

    # Activate the selected version
    version.is_active = True

    # Update company's landing_html
    company.landing_html = version.html

    await db.commit()
    await db.refresh(version)

    return version


@router.delete("/landing-versions/{version_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_version(
    version_id: int,
    db: DbSession,
    current_user: CurrentUser,
):
    """Delete a landing page version."""
    member, company = await get_user_company(db, current_user)

    result = await db.execute(
        select(LandingVersion).where(
            LandingVersion.id == version_id,
            LandingVersion.company_id == company.id,
        )
    )
    version = result.scalar_one_or_none()

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    # If deleting active version, clear company's landing_html
    if version.is_active:
        company.landing_html = None

    await db.delete(version)
    await db.commit()


# ============= TEMPLATE UTILITIES =============


def render_template(html_template: str, variables: dict) -> str:
    """Simple template rendering - replace {{variable}} with values."""
    result = html_template
    for key, value in variables.items():
        placeholder = "{{" + key + "}}"
        result = result.replace(placeholder, str(value) if value else "")
    return result


@router.get("", response_model=list[SectionTemplateResponse])
async def list_templates(
    db: DbSession,
    current_user: CurrentUser,
    section_type: Optional[str] = None,
    include_system: bool = True,
):
    """List all available section templates."""
    query = select(SectionTemplate)

    if section_type:
        query = query.where(SectionTemplate.section_type == section_type)

    # Show system templates + user's own templates
    if include_system:
        query = query.where(
            (SectionTemplate.is_system == True) |
            (SectionTemplate.created_by_id == current_user.id)
        )
    else:
        query = query.where(SectionTemplate.created_by_id == current_user.id)

    query = query.order_by(SectionTemplate.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{template_id}", response_model=SectionTemplateResponse)
async def get_template(
    template_id: int,
    db: DbSession,
    current_user: CurrentUser,
):
    """Get a single template by ID."""
    result = await db.execute(
        select(SectionTemplate).where(SectionTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Check access - system templates are public, user templates are private
    if not template.is_system and template.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return template


@router.post("", response_model=SectionTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: SectionTemplateCreate,
    db: DbSession,
    current_user: CurrentUser,
):
    """Create a new template manually."""
    template = SectionTemplate(
        name=template_data.name,
        description=template_data.description,
        section_type=template_data.section_type,
        html_template=template_data.html_template,
        variables_schema=template_data.variables_schema,
        tags=template_data.tags,
        is_system=False,
        created_by_id=current_user.id,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


@router.patch("/{template_id}", response_model=SectionTemplateResponse)
async def update_template(
    template_id: int,
    template_data: SectionTemplateUpdate,
    db: DbSession,
    current_user: CurrentUser,
):
    """Update a template."""
    result = await db.execute(
        select(SectionTemplate).where(SectionTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Can only update own templates (not system ones)
    if template.is_system or template.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot modify this template")

    update_data = template_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)

    await db.commit()
    await db.refresh(template)
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: int,
    db: DbSession,
    current_user: CurrentUser,
):
    """Delete a template."""
    result = await db.execute(
        select(SectionTemplate).where(SectionTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Can only delete own templates
    if template.is_system or template.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot delete this template")

    await db.delete(template)
    await db.commit()


@router.post("/{template_id}/render", response_model=RenderTemplateResponse)
async def render_template_endpoint(
    template_id: int,
    request: RenderTemplateRequest,
    db: DbSession,
    current_user: CurrentUser,
):
    """Render a template with given variables."""
    result = await db.execute(
        select(SectionTemplate).where(SectionTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Render with variables
    html = render_template(template.html_template, request.variables)

    return RenderTemplateResponse(html=html)


@router.post("/render-html", response_model=RenderTemplateResponse)
async def render_raw_html(
    html_template: str = Form(...),
    variables: str = Form("{}"),  # JSON string
    current_user: CurrentUser = None,
):
    """Render raw HTML template with variables (for preview)."""
    try:
        vars_dict = json.loads(variables)
    except json.JSONDecodeError:
        vars_dict = {}

    html = render_template(html_template, vars_dict)
    return RenderTemplateResponse(html=html)


# ============= HTML EXTRACTION HELPER =============

def extract_html_content(text: str) -> str:
    """Extract only the HTML content from AI response, removing any explanations."""
    # Remove markdown code blocks
    if "```html" in text:
        text = text.split("```html", 1)[1]
    if "```" in text:
        text = text.split("```")[0]

    # Find DOCTYPE and </html>
    text_lower = text.lower()
    doctype_idx = text_lower.find("<!doctype")
    html_end_idx = text_lower.rfind("</html>")

    if doctype_idx >= 0 and html_end_idx > doctype_idx:
        return text[doctype_idx:html_end_idx + 7].strip()
    elif doctype_idx >= 0:
        return text[doctype_idx:].strip()

    return text.strip()


# ============= FULL SITE GENERATION =============


class GenerateFullSiteRequest(BaseModel):
    """Request to generate a full landing page."""
    company_name: str
    description: str
    services: list[str] = []
    phone: Optional[str] = None
    address: Optional[str] = None
    primary_color: str = "#e91e63"
    industry: str = "beauty"
    additional_instructions: Optional[str] = None


class GenerateFullSiteResponse(BaseModel):
    """Response with generated full site HTML."""
    html: str
    estimated_tokens: int


@router.post("/generate-site", response_model=GenerateFullSiteResponse)
async def generate_full_site(
    request: GenerateFullSiteRequest,
    current_user: CurrentUser,
):
    """Generate a complete landing page from business description."""
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI generation not configured. Please set ANTHROPIC_API_KEY."
        )

    # Build the user prompt with business data
    user_prompt = f"""Create a stunning landing page for this business:

BUSINESS INFO:
- Company Name: {request.company_name}
- Description: {request.description}
- Industry: {request.industry}
- Primary Brand Color: {request.primary_color}
- Services: {', '.join(request.services) if request.services else 'Various professional services'}
- Phone: {request.phone or 'Not provided'}
- Address: {request.address or 'Not provided'}

{f'ADDITIONAL REQUIREMENTS: {request.additional_instructions}' if request.additional_instructions else ''}

Remember: Create a COMPLETE, beautiful, modern landing page. Make it look premium and professional. Use the brand color {request.primary_color} as the accent throughout."""

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        message = client.messages.create(
            model="claude-opus-4-20250514",
            max_tokens=16384,
            messages=[
                {
                    "role": "user",
                    "content": FULL_SITE_GENERATION_PROMPT + "\n\n" + user_prompt,
                }
            ],
        )

        # Extract clean HTML
        html_content = extract_html_content(message.content[0].text)
        estimated_tokens = message.usage.input_tokens + message.usage.output_tokens

        return GenerateFullSiteResponse(
            html=html_content,
            estimated_tokens=estimated_tokens,
        )

    except anthropic.APIError as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI API error: {str(e)}"
        )


# ============= FULL SITE FROM IMAGE (with Tool Use like Claude Chat) =============

from app.utils.image_tools import IMAGE_TOOLS, crop_image, crop_region, get_image_info


@router.post("/generate-site-from-image", response_model=GenerateFullSiteResponse)
async def generate_full_site_from_image(
    current_user: CurrentUser,
    images: list[UploadFile] = File(...),
    company_name: str = Form(...),
    prompt: Optional[str] = Form(None),
    mode: str = Form("copy"),  # "copy" uses MASTER_PROMPT
    auto_crop: bool = Form(False),  # Ignored - Claude crops via tools
):
    """Generate a complete landing page from reference image(s).

    Uses tool_use pattern like Claude Chat:
    1. Claude receives full image + tools
    2. Claude can call crop_image/crop_region to examine details
    3. We execute crops and return results
    4. Claude continues until ready to generate HTML
    """
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI generation not configured. Please set ANTHROPIC_API_KEY."
        )

    if not images:
        raise HTTPException(
            status_code=400,
            detail="At least one image is required."
        )

    # Read all images into memory (we'll need them for cropping)
    images_data = []
    image_blocks = []
    print(f"[GENERATE] Processing {len(images)} image(s) with tool_use pattern")

    for idx, image in enumerate(images):
        image_content = await image.read()
        image_size_kb = len(image_content) / 1024
        images_data.append(image_content)

        image_base64 = base64.standard_b64encode(image_content).decode("utf-8")

        media_type = image.content_type or "image/png"
        if media_type not in ["image/jpeg", "image/png", "image/gif", "image/webp"]:
            media_type = "image/png"

        # Get image dimensions
        info = get_image_info(image_content)
        print(f"[GENERATE] Image {idx+1}: {image_size_kb:.1f}KB, {info['width']}x{info['height']}px, type: {media_type}")

        image_blocks.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": media_type,
                "data": image_base64,
            },
        })

    # Build user prompt
    images_info = ""
    for idx, img_data in enumerate(images_data):
        info = get_image_info(img_data)
        images_info += f"\n- Image {idx+1}: {info['width']}x{info['height']} pixels"

    images_note = ""
    if len(images) > 1:
        images_note = f"\n\nNote: {len(images)} reference images provided. They show different parts of the same design - combine them into one cohesive page."

    user_prompt = f"""Create a landing page for: {company_name}

REPLICATE this design EXACTLY. Analyze the reference carefully.

Reference image dimensions:{images_info}

You have tools to crop and zoom into specific areas of the reference image:
- Use get_image_dimensions to know the image size
- Use crop_region to quickly examine sections (header, hero, content, footer)
- Use crop_image with specific coordinates to zoom into details (buttons, icons, typography)

WORKFLOW:
1. First, look at the full image to understand overall layout
2. Use crop_region to examine each section closely
3. Use crop_image to zoom into specific UI elements you need to replicate exactly
4. Once you've analyzed all details, generate the complete HTML

Match colors, fonts, spacing, and layout pixel-perfect.{images_note}"""

    if prompt:
        user_prompt += f"\n\nAdditional requirements: {prompt}"

    try:
        import anthropic
        import time

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        # Initial message content: images + prompt
        initial_content = image_blocks + [
            {
                "type": "text",
                "text": MASTER_PROMPT + "\n\n" + user_prompt,
            }
        ]

        messages = [{"role": "user", "content": initial_content}]

        prompt_length = len(MASTER_PROMPT) + len(user_prompt)
        print(f"[CLAUDE API] Starting agentic loop with {len(image_blocks)} images, prompt: {prompt_length} chars")
        print(f"[CLAUDE API] Model: claude-opus-4-20250514, tools: {len(IMAGE_TOOLS)}")

        start_time = time.time()
        total_input_tokens = 0
        total_output_tokens = 0
        tool_calls = 0
        max_iterations = 20  # Safety limit

        text_content = ""

        for iteration in range(max_iterations):
            print(f"[CLAUDE API] Iteration {iteration + 1}")

            # Call Claude with tools (using streaming for long operations)
            with client.messages.stream(
                model="claude-opus-4-20250514",
                max_tokens=16384,
                tools=IMAGE_TOOLS,
                messages=messages,
            ) as stream:
                response = stream.get_final_message()

            total_input_tokens += response.usage.input_tokens
            total_output_tokens += response.usage.output_tokens

            print(f"[CLAUDE API] Stop reason: {response.stop_reason}, blocks: {len(response.content)}")

            # Check if Claude wants to use tools
            if response.stop_reason == "tool_use":
                # Process tool calls
                tool_results = []

                for block in response.content:
                    if block.type == "tool_use":
                        tool_calls += 1
                        tool_name = block.name
                        tool_input = block.input
                        tool_id = block.id

                        print(f"[TOOL] {tool_name}: {tool_input}")

                        try:
                            # Execute the tool
                            if tool_name == "get_image_dimensions":
                                # Return dimensions of first image (or all if multiple)
                                result_parts = []
                                for idx, img_data in enumerate(images_data):
                                    info = get_image_info(img_data)
                                    result_parts.append(f"Image {idx+1}: {info['width']}x{info['height']} pixels")
                                result_text = "\n".join(result_parts)

                                tool_results.append({
                                    "type": "tool_result",
                                    "tool_use_id": tool_id,
                                    "content": result_text,
                                })

                            elif tool_name == "crop_region":
                                region = tool_input.get("region", "full")
                                # Use first image for cropping (most common case)
                                img_data = images_data[0]
                                crop_base64, crop_media_type = crop_region(img_data, region)

                                print(f"[TOOL] Cropped region '{region}': {len(crop_base64) // 1024}KB")

                                tool_results.append({
                                    "type": "tool_result",
                                    "tool_use_id": tool_id,
                                    "content": [
                                        {
                                            "type": "image",
                                            "source": {
                                                "type": "base64",
                                                "media_type": crop_media_type,
                                                "data": crop_base64,
                                            }
                                        },
                                        {
                                            "type": "text",
                                            "text": f"Cropped region: {region}"
                                        }
                                    ],
                                })

                            elif tool_name == "crop_image":
                                x = tool_input.get("x", 0)
                                y = tool_input.get("y", 0)
                                width = tool_input.get("width", 100)
                                height = tool_input.get("height", 100)

                                # Use first image for cropping
                                img_data = images_data[0]
                                crop_base64, crop_media_type = crop_image(img_data, x, y, width, height)

                                print(f"[TOOL] Cropped ({x},{y}) {width}x{height}: {len(crop_base64) // 1024}KB")

                                tool_results.append({
                                    "type": "tool_result",
                                    "tool_use_id": tool_id,
                                    "content": [
                                        {
                                            "type": "image",
                                            "source": {
                                                "type": "base64",
                                                "media_type": crop_media_type,
                                                "data": crop_base64,
                                            }
                                        },
                                        {
                                            "type": "text",
                                            "text": f"Cropped area: x={x}, y={y}, width={width}, height={height}"
                                        }
                                    ],
                                })

                            else:
                                tool_results.append({
                                    "type": "tool_result",
                                    "tool_use_id": tool_id,
                                    "content": f"Unknown tool: {tool_name}",
                                    "is_error": True,
                                })

                        except Exception as e:
                            print(f"[TOOL ERROR] {tool_name}: {e}")
                            tool_results.append({
                                "type": "tool_result",
                                "tool_use_id": tool_id,
                                "content": f"Error executing {tool_name}: {str(e)}",
                                "is_error": True,
                            })

                # Add assistant message with tool use, then tool results
                messages.append({"role": "assistant", "content": response.content})
                messages.append({"role": "user", "content": tool_results})

            else:
                # Claude is done - extract final text
                for block in response.content:
                    if block.type == "text":
                        text_content = block.text
                        break
                break

        elapsed = time.time() - start_time
        print(f"[CLAUDE API] Completed in {elapsed:.1f}s, {tool_calls} tool calls")
        print(f"[CLAUDE API] Tokens - input: {total_input_tokens}, output: {total_output_tokens}")
        print(f"[CLAUDE API] HTML length: {len(text_content)} chars")

        html_content = extract_html_content(text_content)
        estimated_tokens = total_input_tokens + total_output_tokens

        return GenerateFullSiteResponse(
            html=html_content,
            estimated_tokens=estimated_tokens,
        )

    except anthropic.APIError as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"AI API error: {str(e)}"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )


# ============= IMPROVE EXISTING SITE =============


class ImproveSiteRequest(BaseModel):
    """Request to improve an existing landing page."""
    company_name: str
    current_html: str
    corrections: str


IMPROVE_PROMPT = """You are an expert web developer. Apply the user's corrections to the HTML.

Rules:
1. READ the current HTML carefully
2. APPLY the corrections precisely
3. PRESERVE what's working - don't redesign unless asked
4. Maintain mobile responsiveness
5. Keep technical setup (Tailwind CDN, fonts, etc.)

Output ONLY the complete updated HTML document.
No explanations, no markdown code blocks.
Start with <!DOCTYPE html> and end with </html>."""


@router.post("/improve-site", response_model=GenerateFullSiteResponse)
async def improve_site(
    request: ImproveSiteRequest,
    current_user: CurrentUser,
):
    """Improve an existing landing page based on user corrections."""
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI generation not configured. Please set ANTHROPIC_API_KEY."
        )

    user_prompt = f"""Company: {request.company_name}

CURRENT HTML:
```html
{request.current_html}
```

CORRECTIONS TO APPLY:
{request.corrections}

Please apply these corrections to the HTML and return the updated version."""

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        message = client.messages.create(
            model="claude-opus-4-20250514",
            max_tokens=16384,
            messages=[
                {
                    "role": "user",
                    "content": IMPROVE_PROMPT + "\n\n" + user_prompt,
                }
            ],
        )

        # Extract clean HTML
        html_content = extract_html_content(message.content[0].text)
        estimated_tokens = message.usage.input_tokens + message.usage.output_tokens

        return GenerateFullSiteResponse(
            html=html_content,
            estimated_tokens=estimated_tokens,
        )

    except anthropic.APIError as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI API error: {str(e)}"
        )
