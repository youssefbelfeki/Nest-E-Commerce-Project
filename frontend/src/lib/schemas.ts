import { z } from 'zod';

/**
 * Shared client-side validation schemas.
 *
 * Constraints mirror the backend class-validator DTOs (defense-in-depth):
 * - LoginDto / RegisterDto  -> src/auth/dto/
 * - CreateProductDto        -> src/products/dto/
 * - AddToCartDto / UpdateCartItemDto -> src/cart/dto/
 *
 * Message values are i18n dictionary keys (see dictionaries/en.json, fr.json);
 * render them through `t()` (e.g. via the FieldError component).
 * Form state is string-based, so numeric fields validate the raw string and
 * `.transform` to number for the API payload.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const nonEmptyTrimmed = (v: string) => v.trim().length > 0;

const emailField = z
  .string()
  .min(1, { message: 'validation.required' })
  .refine(nonEmptyTrimmed, { message: 'validation.required' })
  .refine((v) => EMAIL_RE.test(v.trim()), { message: 'validation.emailInvalid' })
  .transform((v) => v.trim());

const requiredNameField = z
  .string()
  .min(1, { message: 'validation.required' })
  .refine(nonEmptyTrimmed, { message: 'validation.required' })
  .transform((v) => v.trim());

/** POST /auth/login */
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, { message: 'validation.required' }),
});
export type LoginValues = z.infer<typeof loginSchema>;

/** POST /auth/register */
export const registerSchema = z.object({
  name: requiredNameField,
  email: emailField,
  password: z.string().min(6, { message: 'register.passwordTooShort' }),
});
export type RegisterValues = z.infer<typeof registerSchema>;

/**
 * POST /products (create) and PATCH /products/:id (edit).
 * The edit form always submits all three fields, so one schema covers both.
 * Input is the string form state; output is the API payload shape.
 */
export const productSchema = z.object({
  name: requiredNameField,
  price: z
    .string()
    .min(1, { message: 'admin.priceInvalid' })
    .refine(
      (v) => v.trim() !== '' && Number.isFinite(Number(v)) && Number(v) > 0,
      { message: 'admin.priceInvalid' }
    )
    .transform((v) => Number(v)),
  stock: z
    .string()
    .min(1, { message: 'admin.stockInvalid' })
    .refine(
      (v) => v.trim() !== '' && Number.isInteger(Number(v)) && Number(v) >= 0,
      { message: 'admin.stockInvalid' }
    )
    .transform((v) => Number(v)),
});
export type ProductFormValues = z.infer<typeof productSchema>;

/** POST /cart/add — quantity already arrives as a number from UI state. */
export const addToCartSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z
    .number({ message: 'validation.quantity' })
    .int({ message: 'validation.quantity' })
    .min(1, { message: 'validation.quantity' }),
});
export type AddToCartValues = z.infer<typeof addToCartSchema>;

/** PATCH /cart/item/:id — quantity guard for the +/- controls. */
export const quantitySchema = z
  .number({ message: 'validation.quantity' })
  .int({ message: 'validation.quantity' })
  .min(1, { message: 'validation.quantity' });

/** First issue per field, keyed by dot-joined path (field name). */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join('.') : '_form';
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
