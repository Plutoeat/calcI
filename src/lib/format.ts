import type Decimal from "decimal.js";

export function formatCurrency(value: Decimal): string {
  const fixed = value.toFixed(2);
  const negative = fixed.startsWith("-");
  const unsigned = negative ? fixed.slice(1) : fixed;
  const [integer, fraction] = unsigned.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}¥${grouped}.${fraction}`;
}

export function formatRate(
  value: Decimal | null,
  options: { digits?: number; fallback?: string } = {},
): string {
  if (!value) {
    return options.fallback ?? "未能收敛";
  }
  const digits = options.digits ?? 2;
  return `${value.times(100).toFixed(digits)}%`;
}

export function formatRange(min: Decimal, max: Decimal): string {
  if (min.eq(max)) {
    return formatCurrency(min);
  }
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
}
