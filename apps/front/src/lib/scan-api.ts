import { z } from "zod";
import { API_BASE_URL } from "./api";
import { getAuthTokens } from "./auth-session";

const shortList = (max: number) => z.array(z.string().trim().min(1).max(500)).min(1).max(max);

export const analyzeResponseSchema = z.object({
  materiales: shortList(5),
  preparacion: shortList(8),
  impacto_inmediato: shortList(4),
  daño_ambiental: shortList(4),
  peso_estimado: z.number().positive(),
});

export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function scanPhotoToBlob(dataUrl: string): Blob {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl);
  if (!match) throw new Error("Selecciona una foto JPEG, PNG o WEBP válida.");
  const base64 = match[2].replace(/\s/g, "");
  if (base64.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4) {
    throw new Error("La foto no puede superar 5 MB.");
  }
  let bytes: Uint8Array<ArrayBuffer>;
  try {
    const decoded = atob(base64);
    bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
  } catch {
    throw new Error("No se pudo leer la foto. Selecciónala nuevamente.");
  }
  if (!bytes.length) throw new Error("La foto está vacía.");
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error("La foto no puede superar 5 MB.");
  return new Blob([bytes], { type: match[1] });
}

export async function apiAnalyzeImage(dataUrl: string, signal?: AbortSignal): Promise<AnalyzeResponse> {
  const tokens = getAuthTokens();
  if (!tokens) throw new Error("Inicia sesión para analizar una foto.");
  const blob = scanPhotoToBlob(dataUrl);
  const extension = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  const form = new FormData();
  form.append("file", blob, `scan.${extension}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/scan/analyze`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
      body: form,
      signal: signal ?? AbortSignal.timeout(45000),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("El análisis tardó demasiado. Intenta nuevamente.");
    }
    throw new Error("No se pudo conectar con el servicio de análisis. Intenta nuevamente.");
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
    const parsed = z.object({ message: z.union([z.string(), z.array(z.string())]) }).safeParse(body);
    const message = parsed.success ? parsed.data.message : null;
    throw new Error((Array.isArray(message) ? message.join(" ") : message) || "No se pudo analizar la imagen. Intenta con otra foto.");
  }
  const parsed = z.object({ data: analyzeResponseSchema }).safeParse(body);
  if (!parsed.success) throw new Error("El servidor devolvió un análisis inválido. Intenta nuevamente.");
  return parsed.data.data;
}
