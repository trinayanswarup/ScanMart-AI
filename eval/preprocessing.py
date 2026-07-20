"""
Image preprocessing for ScanMart AI evaluation.

Shared by eval/run_eval.py (preprocess_image / file-path API) and the
scanmart-preprocess FastAPI microservice (preprocess_image_bytes / bytes API).
All logic lives in _apply_preprocessing() so both entry points stay in sync.
"""

import io
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps


def preprocess_image(image_path: Path) -> Image.Image:
    """Load an image from disk and return a preprocessed PIL Image."""
    return _apply_preprocessing(Image.open(image_path))


def preprocess_image_bytes(data: bytes) -> bytes:
    """Accept raw image bytes, apply preprocessing, return JPEG bytes."""
    img = _apply_preprocessing(Image.open(io.BytesIO(data)))
    out = io.BytesIO()
    img.save(out, format="JPEG", quality=92)
    return out.getvalue()


def _apply_preprocessing(img: Image.Image) -> Image.Image:
    """
    Core pipeline:
      1. EXIF auto-orientation  — fixes sideways / upside-down phone photos
      2. RGB normalisation      — handles RGBA, palette, greyscale inputs
      3. Contrast  ×1.3        — lifts low-contrast labels
      4. Brightness ×1.1       — compensates for dim lighting
      5. Sharpening             — one pass of ImageFilter.SHARPEN
    """
    img = ImageOps.exif_transpose(img)          # 1. orientation
    if img.mode != "RGB":
        img = img.convert("RGB")                # 2. colour mode
    img = ImageEnhance.Contrast(img).enhance(1.3)   # 3. contrast
    img = ImageEnhance.Brightness(img).enhance(1.1) # 4. brightness
    img = img.filter(ImageFilter.SHARPEN)       # 5. sharpen
    return img
