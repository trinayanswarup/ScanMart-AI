# ScanMart AI Evaluation

Runs the same NVIDIA NIM extraction used in production against a labelled image dataset and scores the results.

## Setup

```bash
cd eval
pip install -r requirements.txt
```

The script reads `NVIDIA_API_KEY` from the project root's `.env.local`. Make sure it exists before running.

## Run

```bash
# Raw images (baseline)
python run_eval.py

# Preprocessed images (EXIF orient + contrast + sharpen applied before API call)
python run_eval.py --preprocess
```

Progress is printed per image:

```
Processing 001.jpeg... ✓ match
Processing 002.jpeg... ✗ mismatch  [category: got 'Electronics' ≠ 'Electrical']
...
── Summary ────────────────────────────────────
  Items evaluated  : 22
  Overall match    : 8/22  (36%)
  Name accuracy    : 13/22  (59%)  [WRatio ≥ 70%]
  Category accuracy: 11/22  (50%)  [exact / synonym / substring]
  Price            : excluded (labels rarely display price)
```

**Outputs per run:**

| File | Raw run | Preprocessed run |
|------|---------|-----------------|
| Per-item markdown | `report.md` | `report_preprocessed.md` |
| Raw JSON results | `results.json` | `results_preprocessed.json` |

## Tag report

After running `run_eval.py`, generate a tag-based breakdown with:

```bash
python report.py                 # uses results.json
python report.py --preprocessed  # uses results_preprocessed.json
```

This groups accuracy by image tag (`clean`, `blurry`, `store_branded`, etc.) and saves:
- `tag_report.md` or `tag_report_preprocessed.md`

## Dataset

| Path | Contents |
|------|----------|
| `dataset/images/` | Product photos (`001.jpeg` – `022.jpeg`) |
| `dataset/ground_truth.json` | `[{ "id", "productName", "category", "tags" }]` |

## Scoring rules

| Field | Rule |
|-------|------|
| **productName** | rapidfuzz `WRatio` ≥ 70 (handles abbreviations and rough labels) |
| **category** | Exact match, synonym pair (e.g. Beverages ↔ Drinks), or substring containment |
| **price** | **Excluded** — most physical product labels do not display price |

## Preprocessing

`preprocessing.py` provides the shared image pipeline used by both this eval harness and the `scanmart-preprocess` FastAPI microservice. Compare raw vs preprocessed accuracy before wiring preprocessing into the live app.
