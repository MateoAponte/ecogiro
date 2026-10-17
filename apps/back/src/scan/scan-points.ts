import { BadGatewayException } from '@nestjs/common';

// Beta policy: points per kg. UNKNOWN avoids rewarding an unconfirmed resin.
export const MATERIAL_POINTS = {
  PET: 50,
  HDPE: 60,
  PP: 45,
  LDPE: 35,
  PVC: 20,
  PS: 20,
  OTHER: 20,
  UNKNOWN: 20,
} as const;
export const COMPONENT_POINTS = { cap: 2, label: 1 } as const;
export interface VerifiedItem {
  material: keyof typeof MATERIAL_POINTS;
  weight_kg: number;
  containers: number;
  caps: number;
  labels: number;
}

export function calculateScanPoints(items: VerifiedItem[], weight: number) {
  if (
    !items.length ||
    items.length > 20 ||
    items.some(
      (item) =>
        !Object.hasOwn(MATERIAL_POINTS, item.material) ||
        !Number.isFinite(item.weight_kg) ||
        item.weight_kg <= 0 ||
        Math.abs(item.weight_kg * 1000 - Math.round(item.weight_kg * 1000)) >
          0.000001 ||
        ![item.containers, item.caps, item.labels].every(
          (n) => Number.isInteger(n) && n >= 0 && n <= 1000,
        ) ||
        item.caps > item.containers ||
        item.labels > item.containers,
    ) ||
    Math.round(items.reduce((sum, item) => sum + item.weight_kg * 1000, 0)) !==
      Math.round(weight * 1000)
  ) {
    throw new BadGatewayException(
      'La evidencia de Verify es inconsistente. Intenta nuevamente.',
    );
  }
  const breakdown = items.map((item) => ({
    ...item,
    weight_points: item.weight_kg * MATERIAL_POINTS[item.material],
    cap_points: item.caps * COMPONENT_POINTS.cap,
    label_points: item.labels * COMPONENT_POINTS.label,
  }));
  // Round down once after summing all groups; splitting groups cannot create points.
  const points = Math.floor(
    breakdown.reduce(
      (sum, item) =>
        sum + item.weight_points + item.cap_points + item.label_points,
      0,
    ) + 1e-9,
  );
  return { points, points_breakdown: breakdown };
}
