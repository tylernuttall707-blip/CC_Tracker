// Date helpers
export function todayISO() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export function daysBetween(dateA, dateB) {
  if (!dateA || !dateB) return null;
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  const diff = b - a;
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

// Formatters
export function fmtUSD(number) {
  if (number == null || isNaN(number)) return '$0.00';
  return '$' + Number(number).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function fmtPercent(number) {
  if (number == null || isNaN(number)) return '0.0%';
  return Number(number).toFixed(1) + '%';
}

// Calculations (from latest entry + card)
export function calcUtilization(entry, card) {
  if (!entry || !card || !card.limit) return 0;
  return (entry.currentBalance / card.limit) * 100;
}

export function calcDaysTillDue(entry) {
  if (!entry || !entry.dueDate) return null;
  return daysBetween(todayISO(), entry.dueDate);
}

export function calcClosesIn(entry) {
  if (!entry || !entry.statementEnd) return null;
  return daysBetween(todayISO(), entry.statementEnd);
}

export function calcEstInterest(entry, card) {
  if (!entry || !card || !card.apr) return 0;
  return (card.apr / 100 / 12) * entry.currentBalance;
}

// Entry helpers
export function getLatestEntry(cardId, entries) {
  if (!entries || !entries.length) return null;
  const cardEntries = entries.filter(e => e.cardId === cardId);
  if (!cardEntries.length) return null;
  return cardEntries.reduce((latest, e) => {
    if (!latest) return e;
    return e.date > latest.date ? e : latest;
  }, null);
}

export function getLatestEntries(cards, entries) {
  const map = new Map();
  cards.forEach(card => {
    const latest = getLatestEntry(card.id, entries);
    if (latest) map.set(card.id, latest);
  });
  return map;
}
