import { h, uid } from './dom-utils.js';
import { save, load } from './storage.js';
import { renderDashboard } from './dashboard.js';
import { renderCards } from './cards.js';
import { renderLog } from './log.js';
import { todayISO } from './utils.js';

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
      name: 'New Card',
      issuer: 'Chase',
      limit: 10000,
      apr: 19.99,
      color: '#4F7CFF',
      utilTarget: 30
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
  
  updateDraft(updates) {
    updateState({ draft: { ...state.draft, ...updates } });
  },
  
  clearDraft() {
    updateState({
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
    // Validate
    if (!state.selectedCardId) {
      alert('Please select a card');
      return;
    }
    if (!state.draft.date) {
      alert('Please enter a date');
      return;
    }
    if (!state.draft.currentBalance) {
      alert('Please enter current balance');
      return;
    }
    
    // Create entry
    const entry = {
      id: uid(),
      cardId: state.selectedCardId,
      date: state.draft.date,
      currentBalance: parseFloat(state.draft.currentBalance) || 0,
      remainingStmt: parseFloat(state.draft.remainingStmt) || 0,
      minPayment: parseFloat(state.draft.minPayment) || 0,
      availableCredit: parseFloat(state.draft.availableCredit) || 0,
      overLimit: state.draft.overLimit ? parseFloat(state.draft.overLimit) : null,
      statementEnd: state.draft.statementEnd || null,
      dueDate: state.draft.dueDate || null,
      notes: state.draft.notes || ''
    };
    
    updateState({ entries: [...state.entries, entry] });
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
