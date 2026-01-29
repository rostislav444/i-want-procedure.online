"""Image processing tools for Claude to use via tool_use."""

import base64
import io
from typing import Optional, Literal
from PIL import Image


def get_image_info(image_data: bytes) -> dict:
    """Get image dimensions and format."""
    img = Image.open(io.BytesIO(image_data))
    return {
        "width": img.width,
        "height": img.height,
        "format": img.format,
        "mode": img.mode,
    }


def crop_image(
    image_data: bytes,
    x: int,
    y: int,
    width: int,
    height: int,
    output_format: str = "PNG",
) -> tuple[str, str]:
    """Crop a region from the image.

    Args:
        image_data: Raw image bytes
        x: Left coordinate (pixels from left edge)
        y: Top coordinate (pixels from top edge)
        width: Width of crop region
        height: Height of crop region
        output_format: Output format (PNG, JPEG, WEBP)

    Returns:
        Tuple of (base64_data, media_type)
    """
    img = Image.open(io.BytesIO(image_data))

    # Ensure coordinates are within bounds
    x = max(0, min(x, img.width - 1))
    y = max(0, min(y, img.height - 1))
    width = min(width, img.width - x)
    height = min(height, img.height - y)

    # Crop the region
    cropped = img.crop((x, y, x + width, y + height))

    # Convert to RGB if necessary (for JPEG)
    if output_format.upper() == "JPEG" and cropped.mode in ("RGBA", "P"):
        cropped = cropped.convert("RGB")

    # Save to bytes
    buffer = io.BytesIO()
    cropped.save(buffer, format=output_format.upper())
    buffer.seek(0)

    # Encode to base64
    base64_data = base64.standard_b64encode(buffer.read()).decode("utf-8")

    media_types = {
        "PNG": "image/png",
        "JPEG": "image/jpeg",
        "WEBP": "image/webp",
        "GIF": "image/gif",
    }
    media_type = media_types.get(output_format.upper(), "image/png")

    return base64_data, media_type


def crop_region(
    image_data: bytes,
    region: Literal["header", "hero", "content_top", "content_middle", "content_bottom", "footer", "full"],
    output_format: str = "PNG",
) -> tuple[str, str]:
    """Crop a named region from the image.

    Regions are defined as percentages of image height:
    - header: top 10%
    - hero: 10-35%
    - content_top: 25-50%
    - content_middle: 40-70%
    - content_bottom: 60-90%
    - footer: bottom 15%
    - full: entire image

    Args:
        image_data: Raw image bytes
        region: Named region to crop
        output_format: Output format

    Returns:
        Tuple of (base64_data, media_type)
    """
    img = Image.open(io.BytesIO(image_data))
    w, h = img.width, img.height

    regions = {
        "header": (0, 0, w, int(h * 0.10)),
        "hero": (0, int(h * 0.10), w, int(h * 0.35)),
        "content_top": (0, int(h * 0.25), w, int(h * 0.50)),
        "content_middle": (0, int(h * 0.40), w, int(h * 0.70)),
        "content_bottom": (0, int(h * 0.60), w, int(h * 0.90)),
        "footer": (0, int(h * 0.85), w, h),
        "full": (0, 0, w, h),
    }

    if region not in regions:
        region = "full"

    x1, y1, x2, y2 = regions[region]
    return crop_image(image_data, x1, y1, x2 - x1, y2 - y1, output_format)


# Tool definitions for Claude API
IMAGE_TOOLS = [
    {
        "name": "crop_image",
        "description": """Crop a specific rectangular region from the reference image to examine details more closely.

Use this tool to:
- Zoom in on specific UI elements (buttons, icons, logos)
- Examine typography details (font style, weight, size)
- Check exact colors and gradients
- Analyze spacing and alignment
- Look at decorative elements closely

The image coordinate system: (0,0) is top-left corner. X increases rightward, Y increases downward.""",
        "input_schema": {
            "type": "object",
            "properties": {
                "x": {
                    "type": "integer",
                    "description": "Left edge X coordinate in pixels"
                },
                "y": {
                    "type": "integer",
                    "description": "Top edge Y coordinate in pixels"
                },
                "width": {
                    "type": "integer",
                    "description": "Width of the crop region in pixels"
                },
                "height": {
                    "type": "integer",
                    "description": "Height of the crop region in pixels"
                },
            },
            "required": ["x", "y", "width", "height"]
        }
    },
    {
        "name": "crop_region",
        "description": """Crop a predefined region from the reference image.

Available regions:
- "header": Top navigation area (top 10% of image)
- "hero": Hero/banner section (10-35% from top)
- "content_top": Upper content area (25-50%)
- "content_middle": Middle content area (40-70%)
- "content_bottom": Lower content area (60-90%)
- "footer": Footer section (bottom 15%)
- "full": Entire image (for overview)

Use this for quick section-by-section analysis of the layout.""",
        "input_schema": {
            "type": "object",
            "properties": {
                "region": {
                    "type": "string",
                    "enum": ["header", "hero", "content_top", "content_middle", "content_bottom", "footer", "full"],
                    "description": "Named region to crop"
                }
            },
            "required": ["region"]
        }
    },
    {
        "name": "get_image_dimensions",
        "description": "Get the dimensions (width and height in pixels) of the reference image. Use this first to understand the image size before making crop requests.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    }
]
