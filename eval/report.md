# ScanMart AI Evaluation Report

**Model:** `meta/llama-3.2-11b-vision-instruct`

| Setting | Value |
|---------|-------|
| Name match | rapidfuzz WRatio ≥ 70 |
| Category match | exact match, synonym, or substring |
| Price | excluded — labels rarely display price |

## Summary

| Metric | Score |
|--------|-------|
| Items evaluated | 22 |
| **Overall accuracy** | **8/22 (36%)** |
| Name accuracy | 13/22 (59%) |
| Category accuracy | 11/22 (50%) |

> **Price excluded from scoring.** Most physical product labels do not display
> price, making this an unfair comparison for a vision-based extraction task.

## Per-item Results

| ID | GT Name | AI Name | Name Score | Name | GT Cat | AI Cat | Cat |
|----|---------|---------|------------|------|--------|--------|-----|
| 001 | Rice Murukku | RUBY Snacks RIGE MURUKKU | 86% | ✓ | Snacks | Snacks | ✓ |
| 002 | Voltage Stabilizer | Premier Voltage Stabilizer | 95% | ✓ | Electrical | Electrical | ✓ |
| 003 | Dove Serum Bar | Dove serum bar | 100% | ✓ | Bath | Haircare | ✗ |
| 004 | Prime Hydration | META MOON | 42% | ✗ | Drinks | Beverages | ✓ |
| 005 | Red Beans | Jaisreeram Super Market | 50% | ✗ | Food | Snacks | ✗ |
| 006 | Pergale Milk Chocolate | PERGALÉ MILK HAZELNUT | 70% | ✗ | Snacks | Snacks | ✓ |
| 007 | Samba Rava | Mayil Mark Deluxe Samba Wheat Brokens | 86% | ✓ | Food | Food | ✓ |
| 008 | Samsung Galaxy M56 5G | Galaxy M56 5G | 90% | ✓ | Electronics | Electronics | ✓ |
| 009 | Aqua Lens Cleaner | aqualens | 79% | ✓ | Essentials | Cleaning | ✗ |
| 010 | Fenlong-MR Roll on | Fenlong-MR Roll-On | 94% | ✓ | Medicine | Medicine | ✓ |
| 011 | Sunflower Oil | Gold Winner | 48% | ✗ | Food | Food | ✓ |
| 012 | Disodium Hydrogen Cough Syrup | Disodium Hydrogen Citrate Syrup | 84% | ✓ | Medicine | Medicine | ✓ |
| 013 | Curry Puli | CURRY PULI | 100% | ✓ | Food | Food | ✓ |
| 014 | Natura Air Freshner | Natura Air Freshener | 97% | ✓ | Essentials | Personal Care | ✗ |
| 015 | Prana Cough Formula | PRANA COUGH FORMULA | 100% | ✓ | Medicine | Medicine | ✓ |
| 016 | Skin Cream | VITAMIN E NUTRIENT CONCENTRATE | 49% | ✗ | Medicine | Haircare | ✗ |
| 017 | Face Mist | nua | 36% | ✗ | Essentials | Personal Care | ✗ |
| 018 | Vicks VapoRub | VapoRub Classic | 68% | ✗ | Medicine | Personal Care | ✗ |
| 019 | Eveready AA Batteries | EVEREADY | 90% | ✓ | Electronics | Electrical | ✗ |
| 020 | MAGATOUCH plus | Magnesium Citrate, Vitamin D3, Vitamin E & Zinc Tablets | 38% | ✗ | Medicine | Health Supplements | ✗ |
| 021 | Styling Cream | taft | 30% | ✗ | Essentials | Haircare | ✗ |
| 022 | RedBull Energy Drink | Red Bull | 84% | ✓ | Drinks | Energy Drink | ✗ |
