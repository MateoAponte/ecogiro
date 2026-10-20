import { z } from 'zod';
import { API_BASE_URL } from './api';
import { getAuthTokens } from './auth-session';

export interface ProfileFormData {
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  imageUrl?: string;
}

export function localPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('57') ? digits.slice(2) : digits;
}

const patchSchema = z.object({
  name: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres.').max(255),
  email: z.string().trim().email('Ingresa un correo válido.'),
  phone: z.string().regex(/^\+57\d{10}$/, 'El teléfono debe tener 10 dígitos.'),
  address: z.string().trim().min(1, 'La dirección es obligatoria.'),
});

export async function apiUpdateUserProfile(userId: number, form: ProfileFormData) {
  if (!Number.isSafeInteger(userId) || userId <= 0)
    throw new Error('Se requiere un usuario válido.');
  const tokens = getAuthTokens();
  if (!tokens) throw new Error('Inicia sesión para actualizar tu perfil.');
  const parsed = patchSchema.safeParse({
    name: [form.nombres.trim(), form.apellidos.trim()].filter(Boolean).join(' '),
    email: form.email,
    phone: `+57${localPhone(form.telefono)}`,
    address: form.direccion,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/user/${userId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(parsed.data),
  });
  if (!response.ok) {
    if (response.status === 401)
      throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    const error = z
      .object({ message: z.union([z.string(), z.array(z.string())]) })
      .safeParse(await response.json().catch(() => null));
    const message = error.success ? error.data.message : null;
    throw new Error(
      (Array.isArray(message) ? message.join(' ') : message) ||
        'No se pudo actualizar el perfil.',
    );
  }
  return parsed.data; // PATCH returns 204; do not attempt to read a response body.
}
