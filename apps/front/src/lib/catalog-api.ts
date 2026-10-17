import { z } from "zod";
import { API_BASE_URL } from "./api";
import { getAuthTokens } from "./auth-session";

const catalogFields = {
  id: z.string(),
  name: z.string(),
  description: z.string(),
  image_url: z.string().nullish(),
};

const rewardSchema = z.object({
  ...catalogFields,
  required_points: z.number().nonnegative(),
});

const medailSchema = z.object({
  ...catalogFields,
  condition_type: z.enum(["ECO_POINTS", "COMPLETED_RECOVERIES", "RECYCLED_KG"]),
  condition_value: z.number().positive(),
});

export type Reward = z.infer<typeof rewardSchema>;
export type Medail = z.infer<typeof medailSchema>;

const userMedailSchema = z.object({
  id: z.string(),
  user_id: z.number().int(),
  medail_id: z.string(),
  earned_at: z.string(),
});

export type UserMedail = z.infer<typeof userMedailSchema>;

export function withMedailUnlocks(medails: Medail[], assignments: UserMedail[], userId: number) {
  const earnedIds = new Set(assignments.filter((item) => item.user_id === userId).map((item) => item.medail_id));
  return medails.map((medail) => ({ ...medail, is_unlocked: earnedIds.has(medail.id) }));
}

async function getCatalog<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T[]> {
  const tokens = getAuthTokens();
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/${path}`, {
    signal,
    headers: tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : undefined,
  });
  if (!response.ok) {
    throw new Error("No se pudo cargar el catálogo. Intenta de nuevo.");
  }
  const result = z.object({ data: z.array(schema) }).safeParse(await response.json());
  if (!result.success) throw new Error("El servidor devolvió un catálogo inválido.");
  return result.data.data;
}

export function apiGetRewards(signal?: AbortSignal): Promise<Reward[]> {
  return getCatalog("rewards", rewardSchema, signal);
}

export function apiGetMedails(signal?: AbortSignal): Promise<Medail[]> {
  return getCatalog("medails", medailSchema, signal);
}

export async function apiGetUserMedails(userId: number, signal?: AbortSignal): Promise<UserMedail[]> {
  const assignments = await getCatalog(`user/${userId}/medails`, userMedailSchema, signal);
  if (assignments.some((item) => item.user_id !== userId)) {
    throw new Error("El servidor devolvió medallas de otro usuario.");
  }
  return assignments;
}
