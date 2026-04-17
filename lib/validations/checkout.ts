import { z } from 'zod';

// Algerian phone number validation: starts with 05, 06, or 07, followed by 8 digits
const ALGERIAN_PHONE_REGEX = /^(0|\+213)[5-7][0-9]{8}$/;

export const checkoutFormSchema = z.object({
  fullName: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length >= 3, {
      message: 'Le nom doit contenir au moins 3 caractères',
    })
    .refine((val) => val.length <= 100, {
      message: 'Le nom ne doit pas dépasser 100 caractères',
    }),

  phone: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => ALGERIAN_PHONE_REGEX.test(val), {
      message:
        'Numéro de téléphone algérien invalide (exemple : 0551234567)',
    }),

  wilayaId: z
    .number()
    .int('La wilaya doit être un nombre entier')
    .min(1, 'La wilaya doit être entre 1 et 58')
    .max(58, 'La wilaya doit être entre 1 et 58'),

  commune: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length >= 2, {
      message: 'La commune doit contenir au moins 2 caractères',
    })
    .refine((val) => val.length <= 100, {
      message: 'La commune ne doit pas dépasser 100 caractères',
    }),

  address: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length >= 10, {
      message: "L'adresse doit contenir au moins 10 caractères",
    })
    .refine((val) => val.length <= 500, {
      message: "L'adresse ne doit pas dépasser 500 caractères",
    }),
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

export function validateCheckoutForm(data: unknown): CheckoutFormData {
  return checkoutFormSchema.parse(data);
}
