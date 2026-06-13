export function ksh(amount: number | string): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (!isFinite(n)) return "KSh 0";
  return "KSh " + n.toLocaleString("en-KE", { maximumFractionDigits: 0 });
}