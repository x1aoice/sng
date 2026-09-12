/**
 * Format currency amounts with standard dollar symbol:
 * e.g. 10_000_000 -> "$10M"
 *       2_130_000 -> "$2.13M"
 *         561_000 -> "$561K"
 *       1_280_000 -> "$1.28M"
 */
export function formatCurrency(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0';
  
  let formatted = '';
  const abs = Math.abs(amount);

  if (abs >= 1_000_000_000) {
    formatted = (amount / 1_000_000_000).toFixed(abs % 1_000_000_000 === 0 ? 0 : 2).replace(/\.00$/, '') + 'B';
  } else if (abs >= 1_000_000) {
    const val = amount / 1_000_000;
    formatted = (val >= 10 ? val.toFixed(1) : val.toFixed(2)).replace(/\.0+$/, '') + 'M';
  } else if (abs >= 1_000) {
    const val = amount / 1_000;
    formatted = (val >= 100 ? Math.round(val).toString() : val.toFixed(1)).replace(/\.0+$/, '') + 'K';
  } else {
    formatted = Math.round(amount).toString();
  }

  return `$${formatted}`;
}

// Backward compatibility alias for formatTokens
export const formatTokens = (amount: number, _unusedSuffix?: boolean) => formatCurrency(amount);

export function formatBet(amount: number): string {
  return `Bet ${formatCurrency(amount)}`;
}

export function formatPot(amount: number): string {
  return `Pot ${formatCurrency(amount)}`;
}
