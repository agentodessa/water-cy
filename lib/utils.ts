export function getFillClass(fraction: number): string {
  if (fraction < 0.2) return 'text-red-500';
  if (fraction < 0.5) return 'text-amber-500';
  return 'text-emerald-500';
}

export function getFillBgClass(fraction: number): string {
  if (fraction < 0.2) return 'bg-red-500';
  if (fraction < 0.5) return 'bg-amber-500';
  return 'bg-emerald-500';
}
