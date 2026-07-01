const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-brand-navy text-white',
  DOCENTE: 'bg-amber-500 text-white',
  ESTUDIANTE: 'bg-emerald-600 text-white',
  PADRE: 'bg-violet-600 text-white',
};

export function getInitials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getRoleAvatarClass(rol: string): string {
  return ROLE_COLORS[rol] ?? 'bg-slate-500 text-white';
}
