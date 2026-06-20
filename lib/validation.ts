import { z } from "zod";

export const productAIExtractionSchema = z.object({
  productName: z.string().min(1),
  brand: z.string().optional(),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  description: z.string().min(1),
  suggestedUnit: z.string().min(1),
  suggestedQuantity: z.coerce.number().nonnegative(),
  suggestedPrice: z.coerce.number().positive().optional(),
  confidence: z.number().min(0).max(1),
  detectedText: z.array(z.string()),
  reasoningShort: z.string().min(1),
});

export const inventorySchema = z.object({
  name: z.string().min(2, "Product name is required"),
  brand: z.string().optional(),
  category: z.string().min(1),
  description: z.string().min(4),
  quantity: z.coerce.number().nonnegative(),
  unit: z.string().min(1),
  price: z.coerce.number().positive().optional(),
  lowStockThreshold: z.coerce.number().nonnegative(),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Your name is required"),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
}).refine((value) => Boolean(value.customerPhone || value.customerEmail), {
  message: "Add a phone number or email",
  path: ["customerPhone"],
});
