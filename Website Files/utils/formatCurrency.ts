/**
 * Lightweight currency formatter for inline/button contexts where PriceTag would break layout.
 * Returns a simple formatted string like "£1,234.56"
 */
export function formatCurrency(
  amount: number,
  currency: "GBP" | "USD" | "EUR" = "GBP"
): string {
  const symbol = {
    GBP: "£",
    USD: "$",
    EUR: "€",
  }[currency];

  return `${symbol}${amount.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
