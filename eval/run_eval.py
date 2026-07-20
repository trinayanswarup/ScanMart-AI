#!/usr/bin/env python3
"""
ScanMart AI evaluation script.

Calls the same NVIDIA NIM endpoint used in app/api/extract/route.ts for each
image in dataset/images/, compares results to dataset/ground_truth.json, and
saves a markdown report to report.md.

Usage:
    pip install -r requirements.txt
    python run_eval.py
"""

import base64
import json
import os
import re
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv
from rapidfuzz import fuzz

# ── Paths ─────────────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).parent
IMAGES_DIR = SCRIPT_DIR / "dataset" / "images"
GROUND_TRUTH_FILE = SCRIPT_DIR / "dataset" / "ground_truth.json"
REPORT_FILE = SCRIPT_DIR / "report.md"
ENV_FILE = SCRIPT_DIR.parent / ".env.local"

# ── Config ────────────────────────────────────────────────────────────────────

NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
MODEL = "meta/llama-3.2-11b-vision-instruct"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

NAME_THRESHOLD = 70  # rapidfuzz WRatio 0–100; ≥70 counts as a name match

# Synonyms for category matching: minor taxonomy phrasing differences that
# should count as equivalent (e.g., ground truth "Drinks" vs prompt "Beverages").
CATEGORY_SYNONYMS: dict[str, set[str]] = {
    "beverages": {"drinks"},
    "drinks": {"beverages"},
}

# Identical prompt to app/api/extract/route.ts:
#   PRODUCT_PROMPT with {BUSINESS_TYPE} → "general retail"
#   + the two lines appended in the route handler
#   No ocrText or userText added.
_PROMPT = """\
You are a product label analyzer for ScanMart AI, an inventory management system for small businesses.
Analyze the product image carefully and extract structured data.

Business context: general retail

Return ONLY valid JSON (no markdown, no backticks, no explanation before or after):
{
  "productName": "Clear product name, max 70 chars, title case",
  "brand": "Brand name or null",
  "category": "Pick ONE from: Electronics | Electrical | Haircare | Styling | Personal Care | Bath | Snacks | Beverages | Cleaning | Tools | Food | Medicine | Essentials | Other",
  "description": "1-2 sentence factual product description based on what you see",
  "suggestedUnit": "pcs | kg | g | ml | l | pack | box | bottle | can | bag",
  "suggestedQuantity": 1,
  "suggestedPrice": null or number if a price is visible on the label,
  "confidence": 0.0 to 1.0,
  "detectedText": ["at most 5 key text fragments from the label"],
  "reasoningShort": "One sentence, max 15 words"
}

Keep the entire JSON response under 400 tokens. Descriptions must be 1-2 sentences; detectedText at most 5 items; reasoningShort at most 15 words.

Category rule: Return exactly ONE category string from the list above. Never return multiple categories joined with | or any other delimiter — pick the single best match.

Confidence guide:
- 0.85-1.0: Product name, brand, and category all clearly visible and identifiable
- 0.65-0.84: Product identified but some fields uncertain or partially obscured
- 0.40-0.64: Partial identification, some guessing involved
- Below 0.40: Cannot identify reliably, manual entry required

Look carefully at the image even if partially obscured by fingers, angled, or has glare. Use brand logos, colors, can/bottle shape, and any visible text.

Product packaging often shows the brand name in large bold text and the actual product type/variant in smaller text nearby — extract the full product identity (brand + product type), not just the brand name alone.

If the image shows a repackaged, bulk, or generic product (e.g., loose grains, local shop packaging, house-brand items) where a store or seller name is printed prominently but there is no distinct manufacturer brand, identify the actual product/food type shown (e.g., "Red Kidney Beans", "Rava/Semolina") rather than the store name. A store or seller name printed on packaging is NOT the product name — do not extract it as one.

CRITICAL: Return ONLY the raw JSON object. Do not include any markdown formatting, headers, bold text, or explanatory text before or after the JSON.

Return JSON only:\
"""


# ── API ───────────────────────────────────────────────────────────────────────

def call_nvidia(image_path: Path, api_key: str) -> dict:
    """Send an image to NVIDIA NIM and return the parsed extraction dict."""
    raw_bytes = image_path.read_bytes()
    b64 = base64.b64encode(raw_bytes).decode()

    ext = image_path.suffix.lower()
    if ext in (".jpg", ".jpeg"):
        mime = "image/jpeg"
    elif ext == ".png":
        mime = "image/png"
    else:
        mime = "image/webp"

    payload = {
        "model": MODEL,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": _PROMPT},
                {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
            ],
        }],
        "max_tokens": 1024,
        "temperature": 0.2,
    }

    resp = requests.post(
        NVIDIA_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        json=payload,
        timeout=60,
    )
    resp.raise_for_status()

    raw = resp.json()["choices"][0]["message"]["content"]

    # Same JSON cleaning pipeline as route.ts
    cleaned = re.sub(r"```json\s*", "", raw, flags=re.IGNORECASE)
    cleaned = re.sub(r"```\s*", "", cleaned).strip()
    m = re.search(r"\{[\s\S]*\}", cleaned)
    if m:
        cleaned = m.group(0)

    return json.loads(cleaned)


# ── Comparison ────────────────────────────────────────────────────────────────

def check_name(ai_name: str, gt_name: str) -> tuple[bool, float]:
    """Fuzzy string match. Returns (passed, score_0_to_100)."""
    score = fuzz.WRatio(ai_name.lower().strip(), gt_name.lower().strip())
    return score >= NAME_THRESHOLD, round(score, 1)


def check_category(ai_cat: str, gt_cat: str) -> bool:
    """
    Passes if:
    1. Exact match (case-insensitive), OR
    2. The pair is listed in CATEGORY_SYNONYMS (e.g. Beverages ↔ Drinks), OR
    3. One is a substring of the other (handles minor phrasing like
       "Personal Care" vs "Personal Care Products").
    """
    ai = ai_cat.strip().lower()
    gt = gt_cat.strip().lower()
    if ai == gt:
        return True
    if gt in CATEGORY_SYNONYMS and ai in CATEGORY_SYNONYMS[gt]:
        return True
    if ai in CATEGORY_SYNONYMS and gt in CATEGORY_SYNONYMS[ai]:
        return True
    # Substring fallback — catches minor phrasing differences
    if gt in ai or ai in gt:
        return True
    return False


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    load_dotenv(ENV_FILE)
    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key:
        sys.exit(f"Error: NVIDIA_API_KEY not found in {ENV_FILE}")

    ground_truth: dict[str, dict] = {
        item["id"]: item
        for item in json.loads(GROUND_TRUTH_FILE.read_text(encoding="utf-8"))
    }

    image_files = sorted(
        p for p in IMAGES_DIR.glob("*.*")
        if p.suffix.lower() in IMAGE_EXTS
    )
    if not image_files:
        sys.exit(f"No images found in {IMAGES_DIR}")

    print(f"Evaluating {len(image_files)} images against {len(ground_truth)} ground-truth entries.\n")

    rows: list[dict] = []

    for img_path in image_files:
        item_id = img_path.stem  # "001", "002", …
        gt = ground_truth.get(item_id)
        if gt is None:
            print(f"  Skipping {img_path.name} — no ground truth entry")
            continue

        print(f"Processing {img_path.name}...", end=" ", flush=True)

        try:
            ai = call_nvidia(img_path, api_key)
        except Exception as exc:
            print(f"✗ error  ({exc})")
            rows.append({
                "id": item_id,
                "gt_name": gt["productName"],
                "gt_cat": gt["category"],
                "ai_name": "ERROR",
                "ai_cat": "ERROR",
                "name_ok": False,
                "name_score": 0.0,
                "cat_ok": False,
                "error": str(exc),
            })
            continue

        ai_name: str = ai.get("productName", "")
        ai_cat: str = ai.get("category", "")

        name_ok, name_score = check_name(ai_name, gt["productName"])
        cat_ok = check_category(ai_cat, gt["category"])

        overall_ok = name_ok and cat_ok
        status = "✓ match    " if overall_ok else "✗ mismatch"

        misses = []
        if not name_ok:
            misses.append(f"name {name_score:.0f}% < {NAME_THRESHOLD}%: got '{ai_name}'")
        if not cat_ok:
            misses.append(f"category: got '{ai_cat}' ≠ '{gt['category']}'")

        detail = f"  [{', '.join(misses)}]" if misses else ""
        print(f"{status}{detail}")

        rows.append({
            "id": item_id,
            "gt_name": gt["productName"],
            "gt_cat": gt["category"],
            "ai_name": ai_name,
            "ai_cat": ai_cat,
            "name_ok": name_ok,
            "name_score": name_score,
            "cat_ok": cat_ok,
            "error": None,
        })

        # Brief pause to avoid hammering the free-tier rate limiter
        time.sleep(1)

    # ── Console summary ───────────────────────────────────────────────────────

    n = len(rows)
    if n == 0:
        print("\nNo results to report.")
        return

    n_name = sum(1 for r in rows if r["name_ok"])
    n_cat  = sum(1 for r in rows if r["cat_ok"])
    n_all  = sum(1 for r in rows if r["name_ok"] and r["cat_ok"])

    print()
    print("── Summary " + "─" * 40)
    print(f"  Items evaluated  : {n}")
    print(f"  Overall match    : {n_all}/{n}  ({100 * n_all / n:.0f}%)")
    print(f"  Name accuracy    : {n_name}/{n}  ({100 * n_name / n:.0f}%)  [WRatio ≥ {NAME_THRESHOLD}%]")
    print(f"  Category accuracy: {n_cat}/{n}  ({100 * n_cat / n:.0f}%)  [exact / synonym / substring]")
    print(f"  Price            : excluded (labels rarely display price)")

    # ── Markdown report ───────────────────────────────────────────────────────

    report_lines = [
        "# ScanMart AI Evaluation Report",
        "",
        f"**Model:** `{MODEL}`",
        "",
        "| Setting | Value |",
        "|---------|-------|",
        f"| Name match | rapidfuzz WRatio ≥ {NAME_THRESHOLD} |",
        f"| Category match | exact match, synonym, or substring |",
        f"| Price | excluded — labels rarely display price |",
        "",
        "## Summary",
        "",
        "| Metric | Score |",
        "|--------|-------|",
        f"| Items evaluated | {n} |",
        f"| **Overall accuracy** | **{n_all}/{n} ({100 * n_all / n:.0f}%)** |",
        f"| Name accuracy | {n_name}/{n} ({100 * n_name / n:.0f}%) |",
        f"| Category accuracy | {n_cat}/{n} ({100 * n_cat / n:.0f}%) |",
        "",
        "> **Price excluded from scoring.** Most physical product labels do not display",
        "> price, making this an unfair comparison for a vision-based extraction task.",
        "",
        "## Per-item Results",
        "",
        "| ID | GT Name | AI Name | Name Score | Name | GT Cat | AI Cat | Cat |",
        "|----|---------|---------|------------|------|--------|--------|-----|",
    ]

    for r in rows:
        ai_name_cell = r["ai_name"] if not r.get("error") else "*ERROR*"
        ai_cat_cell  = r["ai_cat"]  if not r.get("error") else "—"

        report_lines.append(
            f"| {r['id']} "
            f"| {r['gt_name']} "
            f"| {ai_name_cell} "
            f"| {r['name_score']:.0f}% "
            f"| {'✓' if r['name_ok'] else '✗'} "
            f"| {r['gt_cat']} "
            f"| {ai_cat_cell} "
            f"| {'✓' if r['cat_ok'] else '✗'} |"
        )

    REPORT_FILE.write_text("\n".join(report_lines) + "\n", encoding="utf-8")
    print(f"\nReport saved → {REPORT_FILE.relative_to(SCRIPT_DIR.parent)}")


if __name__ == "__main__":
    main()
