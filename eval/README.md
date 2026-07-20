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
python run_eval.py
```

Progress is printed per image:

```
Processing 001.jpeg... ✓ match
Processing 002.jpeg... ✗ mismatch  [category: got 'Electronics' ≠ 'Electrical']
...
── Summary ───────────────────────────────────────
  Items evaluated  : 22
  Overall match    : 14/22  (64%)
  Name accuracy    : 19/22  (86%)  [WRatio ≥ 70%]
  Category accuracy: 11/22  (50%)  [exact match]
  Price accuracy   : 16/22  (73%)  [±10% tolerance]
```

A full markdown report is saved to `eval/report.md`.

## Dataset

| Path | Contents |
|------|----------|
| `dataset/images/` | Product photos (`001.jpeg` – `022.jpeg`) |
| `dataset/ground_truth.json` | `[{ "id", "productName", "category", "price" }]` |

## Scoring rules

| Field | Rule |
|-------|------|
| **productName** | rapidfuzz `WRatio` ≥ 70 (handles abbreviations and rough labels) |
| **category** | Exact match, synonym pair (e.g. Beverages ↔ Drinks), or substring containment |
| **price** | **Excluded** — most physical product labels do not display price, making it an unfair comparison for a vision-based extraction task |
