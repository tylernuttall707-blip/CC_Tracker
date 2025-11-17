import { uid } from './dom-utils.js';
import { todayISO } from './utils.js';
import {
  STORAGE_KEY,
  DEFAULT_ISSUER,
  DEFAULT_CREDIT_LIMIT,
  DEFAULT_APR,
  DEFAULT_COLOR,
  DEFAULT_UTIL_TARGET
} from './constants.js';

export function save(state) {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (e) {
    console.error('Failed to save state:', e);

    // Handle quota exceeded error
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      alert('Storage quota exceeded. Please delete some old entries to free up space.');
    } else {
      alert('Failed to save data. Your changes may not be persisted.');
    }
    return false;
  }
}

export function load() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Validate basic structure
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.cards) && Array.isArray(parsed.entries)) {
        return parsed;
      } else {
        console.warn('Invalid data structure in localStorage, creating fresh seed data');
      }
    }
  } catch (e) {
    console.error('Failed to load state:', e);
    alert('Failed to load saved data. Starting with fresh data.');
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
        issuer: DEFAULT_ISSUER,
        limit: DEFAULT_CREDIT_LIMIT,
        apr: DEFAULT_APR,
        color: DEFAULT_COLOR,
        utilTarget: DEFAULT_UTIL_TARGET
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
