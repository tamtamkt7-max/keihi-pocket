export function calculateBusinessAmount(amount: number, percent: number): number {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const safePercent = Number.isFinite(percent) ? percent : 0;
  return Math.round((safeAmount * safePercent) / 100);
}
