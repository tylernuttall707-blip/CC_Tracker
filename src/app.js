import { h, uid } from './dom-utils.js';
import { save, load } from './storage.js';
import { renderDashboard } from './dashboard.js';
import { renderCards } from './cards.js';
import { renderLog } from './log.js';
import { todayISO } from './utils.js';
import {
  FORM_IDS,
  VALIDATION_MESSAGES,
  DEFAULT_CARD_NAME,
  DEFAULT_ISSUER,
  DEFAULT_CREDIT_LIMIT,
  DEFAULT_APR,
  DEFAULT_COLOR,
  DEFAULT_UTIL_TARGET
} from './constants.js';

let state = null;

// Initialize app
function init() {
  state = load();
  applyTheme();
  render();
}

// Apply theme to document
function applyTheme() {
  document.body.className = state.theme;
}

// Save state and re-render
function updateState(partial) {
  state = { ...state, ...partial };
  save(state);
  render();
}

// Actions
const actions = {
  setView(view) {
    updateState({ view });
  },
  
  toggleTheme() {
    const theme = state.theme === 'light' ? 'dark' : 'light';
    updateState({ theme });
    applyTheme();
  },
  
  // Card actions
  addCard() {
    const newCard = {
      id: uid(),
      name: DEFAULT_CARD_NAME,
      issuer: DEFAULT_ISSUER,
      limit: DEFAULT_CREDIT_LIMIT,
      apr: DEFAULT_APR,
      color: DEFAULT_COLOR,
      utilTarget: DEFAULT_UTIL_TARGET
    };
    updateState({ cards: [...state.cards, newCard] });
  },
  
  updateCard(cardId, updates) {
    const cards = state.cards.map(c => 
      c.id === cardId ? { ...c, ...updates } : c
    );
    updateState({ cards });
  },
  
  deleteCard(cardId) {
    const cards = state.cards.filter(c => c.id !== cardId);
    const entries = state.entries.filter(e => e.cardId !== cardId);
    let selectedCardId = state.selectedCardId;
    if (selectedCardId === cardId) {
      selectedCardId = cards.length > 0 ? cards[0].id : null;
    }
    updateState({ cards, entries, selectedCardId });
  },
  
  // Entry actions
  selectCard(cardId) {
    updateState({ selectedCardId: cardId });
  },

  startEditingEntry(entryId) {
    const entry = state.entries.find(e => e.id === entryId);
    if (!entry) return;

    // Populate form fields with entry data
    const populateFormFields = () => {
      const fields = [
        { id: FORM_IDS.DATE_INPUT, value: entry.date },
        { id: FORM_IDS.CURRENT_BALANCE_INPUT, value: entry.currentBalance },
        { id: FORM_IDS.REMAINING_STMT_INPUT, value: entry.remainingStmt },
        { id: FORM_IDS.MIN_PAYMENT_INPUT, value: entry.minPayment },
        { id: FORM_IDS.AVAILABLE_CREDIT_INPUT, value: entry.availableCredit },
        { id: FORM_IDS.OVER_LIMIT_INPUT, value: entry.overLimit || '' },
        { id: FORM_IDS.STMT_END_INPUT, value: entry.statementEnd || '' },
        { id: FORM_IDS.DUE_DATE_INPUT, value: entry.dueDate || '' },
        { id: FORM_IDS.NOTES_INPUT, value: entry.notes || '' }
      ];

      fields.forEach(({ id, value }) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
      });
    };

    populateFormFields();

    // Update state with editing info
    updateState({
      editingEntryId: entryId,
      selectedCardId: entry.cardId,
      draft: {
        date: entry.date,
        currentBalance: entry.currentBalance,
        remainingStmt: entry.remainingStmt,
        minPayment: entry.minPayment,
        availableCredit: entry.availableCredit,
        overLimit: entry.overLimit || '',
        statementEnd: entry.statementEnd || '',
        dueDate: entry.dueDate || '',
        notes: entry.notes || ''
      }
    });
  },

  cancelEdit() {
    actions.clearDraft();
    updateState({ editingEntryId: null });
  },

  clearDraft() {
    // Helper to clear form fields
    const clearFormFields = () => {
      const fields = [
        { id: FORM_IDS.DATE_INPUT, value: todayISO() },
        { id: FORM_IDS.CURRENT_BALANCE_INPUT, value: '' },
        { id: FORM_IDS.REMAINING_STMT_INPUT, value: '' },
        { id: FORM_IDS.MIN_PAYMENT_INPUT, value: '' },
        { id: FORM_IDS.AVAILABLE_CREDIT_INPUT, value: '' },
        { id: FORM_IDS.OVER_LIMIT_INPUT, value: '' },
        { id: FORM_IDS.STMT_END_INPUT, value: '' },
        { id: FORM_IDS.DUE_DATE_INPUT, value: '' },
        { id: FORM_IDS.NOTES_INPUT, value: '' }
      ];

      fields.forEach(({ id, value }) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
      });
    };

    const form = document.getElementById(FORM_IDS.ENTRY_FORM);
    if (form) {
      clearFormFields();
    }

    // Update state to reset draft and editing
    updateState({
      editingEntryId: null,
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
    });
  },
  
  saveEntry() {
    // Helper to get form values
    const getFormValues = () => {
      const getValue = (id) => document.getElementById(id)?.value || '';
      const getNumValue = (id) => {
        const val = getValue(id);
        return val ? parseFloat(val) : null;
      };

      return {
        date: getValue(FORM_IDS.DATE_INPUT),
        currentBalance: getNumValue(FORM_IDS.CURRENT_BALANCE_INPUT),
        remainingStmt: getNumValue(FORM_IDS.REMAINING_STMT_INPUT),
        minPayment: getNumValue(FORM_IDS.MIN_PAYMENT_INPUT),
        availableCredit: getNumValue(FORM_IDS.AVAILABLE_CREDIT_INPUT),
        overLimit: getNumValue(FORM_IDS.OVER_LIMIT_INPUT),
        statementEnd: getValue(FORM_IDS.STMT_END_INPUT) || null,
        dueDate: getValue(FORM_IDS.DUE_DATE_INPUT) || null,
        notes: getValue(FORM_IDS.NOTES_INPUT)
      };
    };

    // Validate
    if (!state.selectedCardId) {
      alert(VALIDATION_MESSAGES.NO_CARD_SELECTED);
      return;
    }

    const formValues = getFormValues();

    if (!formValues.date) {
      alert(VALIDATION_MESSAGES.NO_DATE);
      return;
    }

    if (formValues.currentBalance === null) {
      alert(VALIDATION_MESSAGES.NO_CURRENT_BALANCE);
      return;
    }

    // Validate non-negative values
    if (formValues.currentBalance < 0 && !confirm('Current balance is negative (credit balance). Continue?')) {
      return;
    }

    // Check if we're editing or creating
    if (state.editingEntryId) {
      // Update existing entry
      const entries = state.entries.map(e => {
        if (e.id === state.editingEntryId) {
          return {
            ...e,
            cardId: state.selectedCardId,
            date: formValues.date,
            currentBalance: formValues.currentBalance,
            remainingStmt: formValues.remainingStmt || 0,
            minPayment: formValues.minPayment || 0,
            availableCredit: formValues.availableCredit || 0,
            overLimit: formValues.overLimit,
            statementEnd: formValues.statementEnd,
            dueDate: formValues.dueDate,
            notes: formValues.notes
          };
        }
        return e;
      });
      updateState({ entries, editingEntryId: null });
    } else {
      // Create new entry
      const entry = {
        id: uid(),
        cardId: state.selectedCardId,
        date: formValues.date,
        currentBalance: formValues.currentBalance,
        remainingStmt: formValues.remainingStmt || 0,
        minPayment: formValues.minPayment || 0,
        availableCredit: formValues.availableCredit || 0,
        overLimit: formValues.overLimit,
        statementEnd: formValues.statementEnd,
        dueDate: formValues.dueDate,
        notes: formValues.notes
      };
      updateState({ entries: [...state.entries, entry] });
    }

    actions.clearDraft();
  },
  
  deleteEntry(entryId) {
    const entries = state.entries.filter(e => e.id !== entryId);
    updateState({ entries });
  }
};

// Render entire app
function render() {
  const root = document.getElementById('app');
  root.innerHTML = '';
  
  // Top nav
  root.appendChild(renderNav());
  
  // Main content
  const main = h('main', { class: 'container' });
  
  if (state.view === 'dashboard') {
    main.appendChild(renderDashboard(state, actions));
  } else if (state.view === 'cards') {
    main.appendChild(renderCards(state, actions));
  } else if (state.view === 'log') {
    main.appendChild(renderLog(state, actions));
  }
  
  root.appendChild(main);
}

function renderNav() {
  const nav = h('nav', { class: 'nav' });
  
  // Left side - tabs
  const tabs = h('div', { class: 'nav-tabs' });
  
  tabs.appendChild(renderTab('Dashboard', 'dashboard'));
  tabs.appendChild(renderTab('Cards', 'cards'));
  tabs.appendChild(renderTab('Daily Log', 'log'));
  
  nav.appendChild(tabs);
  
  // Right side - theme toggle
  const themeBtn = h('button', {
    class: 'theme-toggle',
    onclick: actions.toggleTheme,
    title: 'Toggle theme'
  }, state.theme === 'light' ? '🌙' : '☀️');
  
  nav.appendChild(themeBtn);
  
  return nav;
}

function renderTab(label, view) {
  const isActive = state.view === view;
  const btn = h('button', {
    class: 'nav-tab' + (isActive ? ' active' : ''),
    onclick: () => actions.setView(view)
  }, label);
  return btn;
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
