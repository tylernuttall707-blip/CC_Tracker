import { uid } from './dom-utils.js';
import { todayISO } from './utils.js';

const STORAGE_KEY = 'credit-card-tracker-v1';

export function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

export function load() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  // Return fresh seed data
  return createSeedData();
}

function createSeedData() {
  const cardId = uid();
  return {
    theme: 'light',
    view: 'dashboard',
    cards: [
      {
        id: cardId,
        name: 'Sample Card',
        issuer: 'Chase',
        limit: 10000,
        apr: 19.99,
        color: '#4F7CFF',
        utilTarget: 30
      }
    ],
    entries: [
      {
        id: uid(),
        cardId: cardId,
        date: todayISO(),
        currentBalance: 2500,
        remainingStmt: 2500,
        minPayment: 75,
        availableCredit: 7500,
        overLimit: null,
        statementEnd: getDateInFuture(19),
        dueDate: getDateInFuture(33),
        notes: 'Sample entry'
      }
    ],
    selectedCardId: cardId,
    draft: {
      date: todayISO(),
      currentBalance: '',
      remainingStmt: '',
      minPayment: '',
      availableCredit: '',
      overLimit: '',
      statementEnd: '',
      dueDate: '',
      notes: ''
    }
  };
}

function getDateInFuture(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
