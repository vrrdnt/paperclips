// Number formatting utilities (faithful port from original)

const SUFFIXES = [
  '', 'thousand', 'million', 'billion', 'trillion', 'quadrillion',
  'quintillion', 'sextillion', 'septillion', 'octillion', 'nonillion',
  'decillion', 'undecillion', 'duodecillion', 'tredecillion',
  'quattuordecillion', 'quindecillion', 'sexdecillion', 'septendecillion',
  'octodecillion', 'novemdecillion', 'vigintillion',
];

export function formatWithCommas(n: number, decimals = 0): string {
  if (!isFinite(n)) return '0';
  const s = decimals > 0 ? n.toFixed(decimals) : Math.floor(n).toString();
  const parts = s.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

export function spellf(n: number): string {
  if (!isFinite(n) || n === 0) return '0';
  const abs = Math.abs(n);
  if (abs < 1000) return formatWithCommas(Math.round(n));

  const exp = Math.floor(Math.log10(abs));
  const group = Math.floor(exp / 3);

  if (group < SUFFIXES.length) {
    const val = n / Math.pow(10, group * 3);
    return val.toFixed(3) + ' ' + SUFFIXES[group];
  }

  // Scientific notation fallback
  return n.toExponential(3);
}

export function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s} seconds`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minutes`;
  const h = Math.floor(m / 60);
  return `${h} hours`;
}
