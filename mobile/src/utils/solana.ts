export function lamportsToSol(value: unknown, decimalPoint: number): string {
  const num = Number(value);
  return Number.isNaN(num) ? "0" : (num / decimalPoint).toFixed(3);
}
