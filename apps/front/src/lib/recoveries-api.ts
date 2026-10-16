import { z } from "zod";
import { API_BASE_URL } from "./api";
import { getAuthTokens } from "./auth-session";

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
  const statuses = ["EN_ESPERA", "EN_ESPERA", "ACEPTADO", "EXPIRADO", "CANCELADO", "RECOGIDO"];
  return {
    rre_id: recovery.id,
    usu_ciudadano_id: typeof recovery.user_id === "number" ? recovery.user_id : recovery.user_id.id,
    usu_reciclador_id: 0,
    tma_id: 0,
    rre_cantidad_kg: String(recovery.recycled_kg),
    rre_foto_url: "",
    rre_foto_descripcion: recovery.description,
    rre_ubicacion_lat: "",
    rre_ubicacion_lng: "",
    rre_direccion_texto: recovery.address,
    rre_estado: statuses[recovery.status],
    rre_fecha_reporte: recovery.scheduled_date,
    rre_puntos_otorgados: 0,
    comments: recovery.comments ?? "",
  };
}

export async function apiGetRecoveries(userId: number, signal?: AbortSignal): Promise<Report[]> {
  const tokens = getAuthTokens();
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/recovery?user_id=${userId}`, {
    signal,
    headers: tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : undefined,
  });
  if (!response.ok) throw new Error("No se pudieron cargar tus recolecciones.");
  const result = z.object({ data: z.array(recoverySchema) }).safeParse(await response.json());
  if (!result.success) throw new Error("El servidor devolvió recolecciones inválidas.");
  return result.data.data
    .filter((recovery) => (typeof recovery.user_id === "number" ? recovery.user_id : recovery.user_id.id) === userId)
    .map(recoveryToReport);
}
