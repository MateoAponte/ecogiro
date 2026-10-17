export type UserRole = 'CIUDADANO' | 'RECUPERADOR' | 'CENTRO_DE_ACOPIO' | null;

export function normalizeRole(role: string): UserRole {
  const value = role.trim().toUpperCase().replace(/\s+/g, '_');
  if (['2', 'RECOVERY', 'RECUPERADOR'].includes(value)) return 'RECUPERADOR';
  if (value === 'CENTRO_DE_ACOPIO') return 'CENTRO_DE_ACOPIO';
  return 'CIUDADANO';
}

export function roleHome(role: UserRole | undefined): string {
  if (role === 'RECUPERADOR') return '/agent';
  if (role === 'CENTRO_DE_ACOPIO') return '/campaigns';
  return '/';
}
