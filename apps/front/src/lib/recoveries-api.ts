import { z } from 'zod';
import { API_BASE_URL } from './api';
import { getAuthTokens } from './auth-session';

const recoverySchema = z.object({
  id: z.string().uuid(),
  scheduled_date: z.string().datetime({ offset: true }),
  description: z.string(),
  address: z.string(),
  comments: z.string().nullish(),
  recycled_kg: z.number().nonnegative().default(0),
  status: z.number().int().min(0).max(5),
  user_id: z.union([z.number(), z.object({ id: z.number() })]),
});

export type Recovery = z.infer<typeof recoverySchema>;

async function recoveryError(response: Response, fallback: string): Promise<never> {
  if (response.status === 401)
    throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
  const result = z
    .object({ message: z.union([z.string(), z.array(z.string())]) })
    .safeParse(await response.json().catch(() => null));
  const message = result.success ? result.data.message : null;
  throw new Error((Array.isArray(message) ? message.join(' ') : message) || fallback);
}

export async function apiGetRecoveryById(
  id: string,
  userId: number,
  signal?: AbortSignal,
): Promise<Report> {
  if (!z.string().uuid().safeParse(id).success)
    throw new Error('El ID de la recolección no es válido.');
  if (!Number.isSafeInteger(userId) || userId <= 0)
    throw new Error('Se requiere un usuario válido.');
  const tokens = getAuthTokens();
  if (!tokens) throw new Error('Inicia sesión para ver la recolección.');
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/recovery/${id}`, {
    signal,
    cache: 'no-store',
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });
  if (!response.ok)
    return recoveryError(
      response,
      response.status === 404
        ? 'No se encontró la recolección.'
        : 'No se pudo cargar la recolección.',
    );
  const result = z
    .object({
      data: recoverySchema.extend({ user_id: recoverySchema.shape.user_id.optional() }),
    })
    .safeParse(await response.json().catch(() => null));
  if (!result.success || result.data.data.id !== id)
    throw new Error('El servidor devolvió una recolección inválida.');
  // Older detail responses omit the relation ID. The backend now includes it;
  // retain compatibility with that response while mapping the current user's view.
  const report = recoveryToReport({
    ...result.data.data,
    user_id: result.data.data.user_id ?? userId,
  });
  if (report.usu_ciudadano_id !== userId)
    throw new Error('La recolección no pertenece a tu usuario.');
  return report;
}

export async function apiRemoveRecovery(id: string): Promise<void> {
  if (!z.string().uuid().safeParse(id).success)
    throw new Error('El ID de la recolección no es válido.');
  const tokens = getAuthTokens();
  if (!tokens) throw new Error('Inicia sesión para eliminar la recolección.');
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/recovery/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });
  if (!response.ok) return recoveryError(response, 'No se pudo eliminar la recolección.');
}

export interface CreateRecoveryRequest {
  scheduled_date: string;
  description: string;
  address: string;
  comments?: string;
  status: number;
  user_id: number;
}

async function writeRequest(
  path: string,
  method: 'POST' | 'PATCH',
  body: unknown,
): Promise<void> {
  const tokens = getAuthTokens();
  if (!tokens) throw new Error('Inicia sesión para confirmar la solicitud.');
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (response.ok) return; // PATCH /user/:id responds with 204, without a JSON body.
  if (response.status === 401)
    throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
  const result = z
    .object({ message: z.union([z.string(), z.array(z.string())]) })
    .safeParse(await response.json().catch(() => null));
  const message = result.success ? result.data.message : null;
  throw new Error(
    (Array.isArray(message) ? message.join(' ') : message) ||
      'No se pudo guardar la solicitud. Intenta nuevamente.',
  );
}

export function apiCreateRecovery(recovery: CreateRecoveryRequest): Promise<void> {
  return writeRequest('/recovery', 'POST', recovery);
}

export function apiUpdateUserEcoPoints(userId: number, ecoPoints: number): Promise<void> {
  if (!Number.isSafeInteger(ecoPoints) || ecoPoints < 0)
    throw new Error('El saldo de puntos no es válido.');
  return writeRequest(`/user/${userId}`, 'PATCH', { eco_points: ecoPoints });
}

export interface Report {
  rre_id: string | number;
  usu_ciudadano_id: number;
  usu_reciclador_id: number;
  tma_id: number;
  rre_cantidad_kg: string;
  rre_foto_url: string;
  rre_foto_descripcion: string;
  rre_ubicacion_lat: string;
  rre_ubicacion_lng: string;
  rre_direccion_texto: string;
  rre_estado: string;
  rre_fecha_reporte: string;
  rre_fecha_recogida?: string;
  rre_puntos_otorgados: number;
  comments?: string;
}

export function recoveryToReport(recovery: Recovery): Report {
  const statuses = [
    'EN_ESPERA',
    'EN_ESPERA',
    'ACEPTADO',
    'EXPIRADO',
    'CANCELADO',
    'RECOGIDO',
  ];
  return {
    rre_id: recovery.id,
    usu_ciudadano_id:
      typeof recovery.user_id === 'number' ? recovery.user_id : recovery.user_id.id,
    usu_reciclador_id: 0,
    tma_id: 0,
    rre_cantidad_kg: String(recovery.recycled_kg),
    rre_foto_url: '',
    rre_foto_descripcion: recovery.description,
    rre_ubicacion_lat: '',
    rre_ubicacion_lng: '',
    rre_direccion_texto: recovery.address,
    rre_estado: statuses[recovery.status],
    rre_fecha_reporte: recovery.scheduled_date,
    rre_puntos_otorgados: 0,
    comments: recovery.comments ?? '',
  };
}

export async function apiGetRecoveries(
  userId: number,
  signal?: AbortSignal,
): Promise<Report[]> {
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new Error('Se requiere un usuario válido para cargar las recolecciones.');
  }
  const tokens = getAuthTokens();
  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, '')}/recovery?user_id=${userId}`,
    {
      signal,
      headers: tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : undefined,
    },
  );
  if (!response.ok) throw new Error('No se pudieron cargar tus recolecciones.');
  const result = z
    .object({ data: z.array(recoverySchema) })
    .safeParse(await response.json());
  if (!result.success) throw new Error('El servidor devolvió recolecciones inválidas.');
  return result.data.data
    .filter(
      (recovery) =>
        (typeof recovery.user_id === 'number'
          ? recovery.user_id
          : recovery.user_id.id) === userId,
    )
    .map(recoveryToReport);
}
