# scanmart-preprocess

FastAPI microservice that preprocesses product images before AI extraction.

## What it does

`POST /preprocess` accepts a product photo and returns a cleaned JPEG with:

| Step | Effect |
|------|--------|
| EXIF auto-orientation | Fixes sideways / upside-down phone photos |
| Contrast ×1.3 | Lifts low-contrast labels |
| Brightness ×1.1 | Compensates for dim lighting |
| Sharpening | Sharpens text so the vision model reads it more cleanly |

The same pipeline lives in `../eval/preprocessing.py` — `main.py` imports it directly to avoid code duplication.

## Run locally

```bash
cd scanmart-preprocess
pip install -r requirements.txt
uvicorn main:app --reload
```

Open http://localhost:8000/docs for the interactive API (FastAPI's built-in Swagger UI).

## Test with curl

```bash
curl -X POST http://localhost:8000/preprocess \
  -F "file=@/path/to/product.jpg" \
  --output preprocessed.jpg
```

Check the health endpoint:

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

## Deploy on Render

1. Push the full repo to GitHub (not just this subdirectory — `main.py` imports from `../eval/`).
2. Create a new **Web Service** on Render, pointing at this repo.
3. Set **Root Directory** to `scanmart-preprocess`.
4. Set **Build Command**: `pip install -r requirements.txt`
5. Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

No environment variables required — the service is stateless.

## Status

Working and testable locally. **Not yet wired into the live Next.js scan page.**
Wiring happens after we confirm preprocessing improves eval accuracy (run `eval/run_eval.py --preprocess`).
