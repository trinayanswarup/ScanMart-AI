#!/usr/bin/env python3
"""
Tag-based accuracy report for ScanMart AI evaluation.

Reads results.json (produced by run_eval.py) and dataset/ground_truth.json
for tag metadata, then groups accuracy by tag and writes tag_report.md.

Usage:
    python report.py                 # reads results.json
    python report.py --preprocessed  # reads results_preprocessed.json
"""

import argparse
import json
from pathlib import Path

import pandas as pd

SCRIPT_DIR = Path(__file__).parent
GROUND_TRUTH_FILE = SCRIPT_DIR / "dataset" / "ground_truth.json"


def main() -> None:
    parser = argparse.ArgumentParser(description="Tag-based accuracy report.")
    parser.add_argument(
        "--preprocessed",
        action="store_true",
        help="Read results_preprocessed.json instead of results.json.",
    )
    args = parser.parse_args()

    suffix = "_preprocessed" if args.preprocessed else ""
    results_file = SCRIPT_DIR / f"results{suffix}.json"
    tag_report_file = SCRIPT_DIR / f"tag_report{suffix}.md"

    if not results_file.exists():
        extra = " --preprocess" if args.preprocessed else ""
        print(f"Error: {results_file} not found. Run:  python run_eval.py{extra}")
        return

    results = json.loads(results_file.read_text(encoding="utf-8"))
    ground_truth = {
        item["id"]: item
        for item in json.loads(GROUND_TRUTH_FILE.read_text(encoding="utf-8"))
    }

    # Expand: images with multiple tags appear in each tag group they belong to.
    rows = []
    for r in results:
        gt = ground_truth.get(r["id"], {})
        tags = gt.get("tags") or ["untagged"]
        for tag in tags:
            rows.append({
                "id": r["id"],
                "tag": tag,
                "name_ok": bool(r.get("name_ok", False)),
                "cat_ok": bool(r.get("cat_ok", False)),
                "overall_ok": bool(r.get("name_ok", False) and r.get("cat_ok", False)),
            })

    df = pd.DataFrame(rows)

    # Per-tag stats
    tag_stats = []
    for tag, group in df.groupby("tag"):
        tag_stats.append({
            "Tag": tag,
            "Images": group["id"].nunique(),
            "Name": f"{group['name_ok'].mean() * 100:.0f}%",
            "Category": f"{group['cat_ok'].mean() * 100:.0f}%",
            "Overall": f"{group['overall_ok'].mean() * 100:.0f}%",
        })
    stats_df = pd.DataFrame(tag_stats).sort_values("Tag").reset_index(drop=True)

    # Overall totals (deduplicate by id before averaging so multi-tag items aren't over-counted)
    item_df = df.groupby("id").first().reset_index()
    total = len(item_df)
    overall_name = item_df["name_ok"].mean()
    overall_cat = item_df["cat_ok"].mean()
    overall_both = item_df["overall_ok"].mean()

    label = " (preprocessed)" if args.preprocessed else ""

    lines = [
        f"# ScanMart AI — Tag Accuracy Report{label}",
        "",
        f"Items evaluated: **{total}**  ·  "
        f"Name: **{overall_name:.0%}**  ·  "
        f"Category: **{overall_cat:.0%}**  ·  "
        f"Overall: **{overall_both:.0%}**",
        "",
        "## Accuracy by Tag",
        "",
        "> Items with multiple tags are counted in each of their tag groups.",
        "> Overall totals above are deduplicated (each image counted once).",
        "",
        "| Tag | Images | Name | Category | Overall |",
        "|-----|--------|------|----------|---------|",
    ]
    for _, row in stats_df.iterrows():
        lines.append(
            f"| {row['Tag']} | {row['Images']} "
            f"| {row['Name']} | {row['Category']} | {row['Overall']} |"
        )
    lines += ["", ""]

    tag_report_file.write_text("\n".join(lines), encoding="utf-8")

    print(stats_df.to_string(index=False))
    print()
    print(f"Overall  Name: {overall_name:.0%}  Category: {overall_cat:.0%}  Both: {overall_both:.0%}")
    print(f"\nTag report saved → {tag_report_file.relative_to(SCRIPT_DIR.parent)}")


if __name__ == "__main__":
    main()
