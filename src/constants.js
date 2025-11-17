// Application Constants

// Date and Time
export const DAYS_FOR_DUE_SOON = 7;
export const CALENDAR_WEEKS = 4;
export const DAYS_IN_WEEK = 7;

// Limits
export const MAX_HISTORY_ENTRIES = 100;
export const MAX_NOTES_LENGTH = 500;
export const MAX_CARD_NAME_LENGTH = 50;

// Default Values
export const DEFAULT_CARD_NAME = 'New Card';
export const DEFAULT_ISSUER = 'Chase';
export const DEFAULT_CREDIT_LIMIT = 10000;
export const DEFAULT_APR = 19.99;
export const DEFAULT_UTIL_TARGET = 30;
export const DEFAULT_COLOR = '#4F7CFF';

// Color Presets
export const PRESET_COLORS = [
  '#4F7CFF', '#FF6B6B', '#51CF66', '#FFD43B',
  '#9775FA', '#FF8787', '#339AF0', '#FFA94D'
];

// Issuer Options
export const ISSUERS = ['Chase', 'AmEx', 'Discover', 'Citi', 'Capital One', 'Other'];

// Calculation Constants
export const MONTHS_IN_YEAR = 12;
export const DAYS_IN_YEAR = 365;

// Storage Keys
export const STORAGE_KEY = 'credit-card-tracker-v1';

// Form Field IDs
export const FORM_IDS = {
  CARD_SELECT: 'card-select',
  DATE_INPUT: 'date-input',
  CURRENT_BALANCE_INPUT: 'current-balance-input',
  REMAINING_STMT_INPUT: 'remaining-stmt-input',
  MIN_PAYMENT_INPUT: 'min-payment-input',
  AVAILABLE_CREDIT_INPUT: 'available-credit-input',
  OVER_LIMIT_INPUT: 'over-limit-input',
  STMT_END_INPUT: 'stmt-end-input',
  DUE_DATE_INPUT: 'due-date-input',
  NOTES_INPUT: 'notes-input',
  ENTRY_FORM: 'entry-form'
};

// Validation Messages
export const VALIDATION_MESSAGES = {
  NO_CARD_SELECTED: 'Please select a card',
  NO_DATE: 'Please enter a date',
  NO_CURRENT_BALANCE: 'Please enter current balance',
  INVALID_NUMBER: 'Please enter a valid number',
  CARD_NO_LIMIT: 'Selected card has no credit limit set',
  NEGATIVE_VALUE: 'Value cannot be negative'
};

// Empty State Messages
export const EMPTY_STATES = {
  NO_CARDS: 'No cards yet. Click "Add Card" to get started.',
  NO_ENTRIES: 'No entries yet',
  NO_CARDS_FOR_LOG: 'Please add a card first.',
  NO_CARDS_ADDED: 'No cards added yet'
};
