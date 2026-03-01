export function formatMCM(value: number): string {
  return value < 1 ? `${value.toFixed(3)} MCM` : `${value.toFixed(1)} MCM`;
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
