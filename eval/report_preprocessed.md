# ScanMart AI Evaluation Report (preprocessed)

**Model:** `meta/llama-3.2-11b-vision-instruct`

| Setting | Value |
|---------|-------|
| Name match | rapidfuzz WRatio ≥ 70 |
| Category match | exact match, synonym, or substring |
| Price | excluded — labels rarely display price |
| Preprocessing | enabled |

## Summary

| Metric | Score |
|--------|-------|
| Items evaluated | 22 |
| **Overall accuracy** | **10/22 (45%)** |
| Name accuracy | 15/22 (68%) |
| Category accuracy | 13/22 (59%) |

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
| 006 | Pergale Milk Chocolate | PERGALE | 90% | ✓ | Snacks | Snacks | ✓ |
| 007 | Samba Rava | Mayil Mark Deluxe Samba Wheat Brokens | 86% | ✓ | Food | Food | ✓ |
| 008 | Samsung Galaxy M56 5G | Galaxy M56 5G | 90% | ✓ | Electronics | Electronics | ✓ |
| 009 | Aqua Lens Cleaner | aqualens | 79% | ✓ | Essentials | Cleaning | ✗ |
| 010 | Fenlong-MR Roll on | Fenlong-MR Roll-On | 94% | ✓ | Medicine | Medicine | ✓ |
| 011 | Sunflower Oil | Gold Winner | 48% | ✗ | Food | Food | ✓ |
| 012 | Disodium Hydrogen Cough Syrup | Disodium Hydrogen Citrate Syrup | 84% | ✓ | Medicine | Medicine | ✓ |
| 013 | Curry Puli | Curry Puli | 100% | ✓ | Food | Food | ✓ |
| 014 | Natura Air Freshner | Natura Air Freshener | 97% | ✓ | Essentials | Other | ✗ |
| 015 | Prana Cough Formula | PRANA COUGH FORMULA | 100% | ✓ | Medicine | Medicine | ✓ |
| 016 | Skin Cream | VITAMIN C AND MONOHYDRATE | 54% | ✗ | Medicine | Personal Care | ✗ |
| 017 | Face Mist | green tea revitalizing face mist | 90% | ✓ | Essentials | Personal Care | ✗ |
| 018 | Vicks VapoRub | VapoRub Classic | 68% | ✗ | Medicine | Personal Care | ✗ |
| 019 | Eveready AA Batteries | EVEREADY AA1015 | 66% | ✗ | Electronics | Electrical | ✗ |
| 020 | MAGATOUCH plus | Magnesium Citrate, Vitamin D3, Vitamin E & Zinc Tablets | 38% | ✗ | Medicine | Medicine | ✓ |
| 021 | Styling Cream | Aloe Boost Styling Cream | 90% | ✓ | Essentials | Haircare | ✗ |
| 022 | RedBull Energy Drink | Red Bull Energy Drink | 98% | ✓ | Drinks | Beverages | ✓ |
