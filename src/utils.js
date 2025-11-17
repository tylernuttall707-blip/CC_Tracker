// Date helpers
export function todayISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysBetween(dateA, dateB) {
  if (!dateA || !dateB) return null;
  try {
    // Parse dates in local timezone to avoid timezone issues
    const [yearA, monthA, dayA] = dateA.split('-').map(Number);
    const [yearB, monthB, dayB] = dateB.split('-').map(Number);
    const a = new Date(yearA, monthA - 1, dayA);
    const b = new Date(yearB, monthB - 1, dayB);

    // Validate dates
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;

    const diff = b - a;
    return Math.round(diff / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Error calculating days between dates:', error);
    return null;
  }
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
  if (!entry || !card || !card.limit || card.limit <= 0) return 0;

  const balance = entry.currentBalance || 0;
  // Handle negative balances (credits)
  if (balance < 0) return 0;

  const utilization = (balance / card.limit) * 100;
  // Cap at 100% for display purposes (over limit shows separately)
  return Math.min(utilization, 999.9); // Allow showing over 100% but cap at reasonable display value
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
  if (!entry || !card || !card.apr || card.apr <= 0) return 0;

  const balance = entry.currentBalance || 0;
  // No interest on negative balances (credits) or zero balance
  if (balance <= 0) return 0;

  // Use average daily balance method (more accurate than simple monthly)
  // Assumes balance is carried for full month
  const dailyRate = (card.apr / 100) / 365;
  const avgDaysInMonth = 30.44; // Average days in month (365/12)

  // Daily compound interest formula: Principal * ((1 + daily_rate)^days - 1)
  const interest = balance * (Math.pow(1 + dailyRate, avgDaysInMonth) - 1);

  return Math.max(0, interest);
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
