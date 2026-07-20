"""
ScanMart AI preprocessing microservice.

FastAPI app with one endpoint:  POST /preprocess
  - Accepts a product image upload
  - Applies the same pipeline as eval/preprocessing.py
    (EXIF orientation, contrast ×1.3, brightness ×1.1, sharpening)
  - Returns the cleaned image as JPEG

Usage:
    uvicorn main:app --reload

Interactive docs:
    http://localhost:8000/docs
"""

import io
import sys
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

# Share preprocessing logic from eval/ — no code duplication.
# Assumes this service is run from inside the repo (scanmart-preprocess/ is a
# sibling of eval/), which is always true whether local or deployed on Render.
sys.path.insert(0, str(Path(__file__).parent.parent / "eval"))
from preprocessing import preprocess_image_bytes  # noqa: E402

ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_BYTES = 20 * 1024 * 1024  # 20 MB

app = FastAPI(
    title="ScanMart Preprocess",
    description=(
        "Auto-orients, normalises contrast, and sharpens product images "
        "before AI extraction. Used by the ScanMart AI scan pipeline."
    ),
    version="0.1.0",
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post(
    "/preprocess",
    response_class=StreamingResponse,
    responses={
        200: {"content": {"image/jpeg": {}}, "description": "Preprocessed JPEG image"},
        413: {"description": "Image too large (max 20 MB)"},
        415: {"description": "Unsupported file type"},
        422: {"description": "Could not process image"},
    },
    summary="Preprocess a product image",
    description=(
        "Accepts a JPEG, PNG, or WebP image and returns a cleaned JPEG with:\n\n"
        "- **EXIF auto-orientation** — fixes sideways phone photos\n"
        "- **Contrast normalisation** (×1.3)\n"
        "- **Brightness normalisation** (×1.1)\n"
        "- **Sharpening** (one-pass PIL filter)\n\n"
        "This is the same pipeline used in `eval/preprocessing.py`."
    ),
)
async def preprocess(file: UploadFile = File(...)) -> StreamingResponse:
    content_type = (file.content_type or "").split(";")[0].strip()
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type '{content_type}'. "
                "Send image/jpeg, image/png, or image/webp."
            ),
        )

    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Image too large. Maximum 20 MB.")

    try:
        cleaned = preprocess_image_bytes(data)
    except Exception as exc:
        raise HTTPException(
            status_code=422, detail=f"Could not process image: {exc}"
        ) from exc

    return StreamingResponse(
        io.BytesIO(cleaned),
        media_type="image/jpeg",
        headers={"Content-Disposition": 'inline; filename="preprocessed.jpg"'},
    )
