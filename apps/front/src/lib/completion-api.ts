import { z } from 'zod';
import { API_BASE_URL } from './api';
import { getAuthTokens } from './auth-session';
import { scanPhotoToBlob } from './scan-api';

async function request(path: string, options: RequestInit, signal: AbortSignal) {
  const tokens = getAuthTokens();
  if (!tokens) throw new Error('Inicia sesión nuevamente.');
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}${path}`, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${tokens.accessToken}` },
    signal: AbortSignal.any([signal, AbortSignal.timeout(45000)]),
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = z
      .object({ message: z.union([z.string(), z.array(z.string())]) })
      .safeParse(body);
    throw new Error(
      parsed.success
        ? [parsed.data.message].flat().join(' ')
        : 'No se pudo completar la recolección.',
    );
  }
  return body;
}

export async function apiAchieved(
  dataUrl: string,
  recoveryId: string,
  signal: AbortSignal,
) {
  const form = new FormData();
  form.append('file', scanPhotoToBlob(dataUrl), 'collection.jpg');
  form.append('recovery_id', recoveryId);
  const body = await request('/scan/achieved', { method: 'POST', body: form }, signal);
  const result = z
    .object({
      data: z.object({
        is_valid: z.literal(true),
        reason_invalid: z.null(),
        materials: z.array(z.string()).min(1).max(5),
        verification_token: z.string().min(1),
      }),
    })
    .safeParse(body);
  if (!result.success) throw new Error('La respuesta de verificación no es válida.');
  return result.data.data;
}

export async function apiCompleteRecovery(
  id: string,
  token: string,
  signal: AbortSignal,
) {
  const body = await request(
    `/recovery/${id}/complete`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verification_token: token }),
    },
    signal,
  );
  const result = z
    .object({ data: z.object({ id: z.literal(id), status: z.literal(5) }) })
    .safeParse(body);
  if (!result.success)
    throw new Error('El servidor no confirmó la recolección completada.');
}
