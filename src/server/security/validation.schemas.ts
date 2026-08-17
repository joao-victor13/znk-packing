import { z } from 'zod';

// -----------------------------------------------------------------------------
// HELPER: Validação Matemática de CNPJ (Dígitos Verificadores)
// -----------------------------------------------------------------------------
function validateCNPJ(val: string): boolean {
  const clean = val.replace(/\D/g, '');
  if (clean.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(clean)) return false;

  let size = clean.length - 2;
  let numbers = clean.substring(0, size);
  const digits = clean.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0), 10)) return false;

  size = size + 1;
  numbers = clean.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1), 10);
}

// -----------------------------------------------------------------------------
// 1. SCHEMA ZOD: AUTENTICAÇÃO / LOGIN
// -----------------------------------------------------------------------------
export const LoginInputSchema = z.object({
  email: z
    .string()
    .min(1, 'O e-mail é obrigatório.')
    .trim()
    .toLowerCase()
    .email('Formato de e-mail inválido.')
    .max(120, 'O e-mail não pode exceder 120 caracteres.'),
  password: z
    .string()
    .min(8, 'A senha deve conter no mínimo 8 caracteres.')
    .max(128, 'A senha não pode exceder 128 caracteres.'),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

// -----------------------------------------------------------------------------
// 2. SCHEMA ZOD: CONFIGURAÇÕES DA MARCA (STORE SETTINGS)
// -----------------------------------------------------------------------------
export const StoreSettingsInputSchema = z.object({
  brandName: z
    .string()
    .min(2, 'O nome da marca deve ter no mínimo 2 caracteres.')
    .max(100, 'O nome da marca não pode exceder 100 caracteres.')
    .trim()
    .transform((val: string) => val.replace(/<[^>]*>?/gm, '')), // Sanitização XSS básica
  brandSlogan: z
    .string()
    .trim()
    .max(200, 'O slogan não pode exceder 200 caracteres.')
    .optional()
    .nullable(),
  legalName: z
    .string()
    .min(3, 'A Razão Social deve ter no mínimo 3 caracteres.')
    .max(150, 'A Razão Social não pode exceder 150 caracteres.')
    .trim(),
  cnpj: z
    .string()
    .min(1, 'O CNPJ é obrigatório.')
    .trim()
    .refine((val: string) => validateCNPJ(val), {
      message: 'CNPJ inválido (dígitos verificadores incorretos).',
    }),
  purchasingEmail: z
    .string()
    .min(1, 'O e-mail de compras é obrigatório.')
    .trim()
    .toLowerCase()
    .email('E-mail de compras inválido.')
    .max(120),
  whatsappBusiness: z
    .string()
    .min(1, 'O WhatsApp Comercial é obrigatório.')
    .trim()
    .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, 'Formato de WhatsApp inválido (ex: 11987654321 ou (11) 98765-4321).'),
  phoneSecondary: z
    .string()
    .trim()
    .optional()
    .nullable(),
  showroomAddress: z
    .string()
    .min(5, 'Endereço muito curto.')
    .max(255)
    .trim(),
  city: z
    .string()
    .min(2, 'A cidade é obrigatória.')
    .max(80)
    .trim(),
  state: z
    .string()
    .length(2, 'O Estado deve ter exatamente 2 caracteres (UF).')
    .trim()
    .toUpperCase(),
  currencySymbol: z
    .string()
    .trim()
    .default('R$')
    .transform((val: string) => val || 'R$'),
  legalFooterNotes: z
    .string()
    .trim()
    .max(1000, 'O rodapé legal não pode exceder 1000 caracteres.')
    .optional()
    .nullable(),
  logoUrl: z
    .string()
    .trim()
    .url('URL da logo inválida.')
    .optional()
    .nullable(),
});

export type StoreSettingsInput = z.infer<typeof StoreSettingsInputSchema>;
