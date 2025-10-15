import { h, uid } from './dom-utils.js';
import { fmtUSD, todayISO, getLatestEntry } from './utils.js';

export function renderLog(state, actions) {
  const container = h('div', { class: 'log-page' });
  
  container.appendChild(h('h2', {}, 'Daily Log'));
  
  // Entry Form
  container.appendChild(h('section', { class: 'panel' },
    h('h3', {}, 'Log Entry'),
    renderEntryForm(state, actions)
  ));
  
  // History Table
  container.appendChild(h('section', { class: 'panel' },
    h('h3', {}, 'History'),
    renderHistoryFilters(state, actions),
    renderHistoryTable(state, actions)
  ));
  
  return container;
}

function renderEntryForm(state, actions) {
  const form = h('div', { class: 'entry-form', id: 'entry-form' });
  
  if (!state.cards.length) {
    form.appendChild(h('div', { class: 'muted' }, 'Please add a card first.'));
    return form;
  }
  
  const grid = h('div', { class: 'form-grid' });
  
  // Card selector (controlled - dropdowns don't have focus issues)
  const cardSelect = h('select', {
    id: 'card-select',
    value: state.selectedCardId || '',
    onchange: (e) => actions.selectCard(e.target.value)
  },
    h('option', { value: '' }, '-- Select Card --'),
    ...state.cards.map(c => h('option', { value: c.id }, c.name))
  );
  grid.appendChild(renderField('Card *', cardSelect));
  
  // Date (uncontrolled - no oninput, just default value)
  const dateInput = h('input', {
    type: 'date',
    id: 'date-input',
    value: state.draft.date || todayISO()
  });
  grid.appendChild(renderField('Date *', dateInput));
  
  // Due Date with Suggest button (uncontrolled)
  const dueDateInput = h('input', {
    type: 'date',
    id: 'due-date-input',
    value: state.draft.dueDate || ''
  });
  const dueDateRow = h('div', { class: 'field-row' });
  dueDateRow.appendChild(dueDateInput);
  dueDateRow.appendChild(h('button', {
    class: 'btn-suggest',
    onclick: () => {
      if (!state.selectedCardId) return;
      const latest = getLatestEntry(state.selectedCardId, state.entries);
      if (latest && latest.dueDate) {
        dueDateInput.value = latest.dueDate;
      }
    }
  }, 'Suggest'));
  grid.appendChild(renderField('Due Date', dueDateRow));
  
  // Current Balance (uncontrolled)
  grid.appendChild(renderField('Current Balance *', h('input', {
    type: 'number',
    id: 'current-balance-input',
    value: state.draft.currentBalance || '',
    min: '0',
    step: '0.01',
    placeholder: '0.00'
  })));
  
  // Remaining Statement Balance (uncontrolled)
  grid.appendChild(renderField('Remaining Stmt Balance', h('input', {
    type: 'number',
    id: 'remaining-stmt-input',
    value: state.draft.remainingStmt || '',
    min: '0',
    step: '0.01',
    placeholder: '0.00'
  })));
  
  // Available Credit (uncontrolled)
  grid.appendChild(renderField('Available Credit', h('input', {
    type: 'number',
    id: 'available-credit-input',
    value: state.draft.availableCredit || '',
    min: '0',
    step: '0.01',
    placeholder: '0.00'
  })));
  
  // Statement End with Suggest button (uncontrolled)
  const stmtEndInput = h('input', {
    type: 'date',
    id: 'stmt-end-input',
    value: state.draft.statementEnd || ''
  });
  const stmtEndRow = h('div', { class: 'field-row' });
  stmtEndRow.appendChild(stmtEndInput);
  stmtEndRow.appendChild(h('button', {
    class: 'btn-suggest',
    onclick: () => {
      if (!state.selectedCardId) return;
      const latest = getLatestEntry(state.selectedCardId, state.entries);
      if (latest && latest.statementEnd) {
        stmtEndInput.value = latest.statementEnd;
      }
    }
  }, 'Suggest'));
  grid.appendChild(renderField('Statement End', stmtEndRow));
  
  // Minimum Payment (uncontrolled)
  grid.appendChild(renderField('Minimum Payment', h('input', {
    type: 'number',
    id: 'min-payment-input',
    value: state.draft.minPayment || '',
    min: '0',
    step: '0.01',
    placeholder: '0.00'
  })));
  
  // Over Limit with Auto Calculate button (uncontrolled)
  const overLimitInput = h('input', {
    type: 'number',
    id: 'over-limit-input',
    value: state.draft.overLimit || '',
    min: '0',
    step: '0.01',
    placeholder: '0.00'
  });
  const overLimitRow = h('div', { class: 'field-row' });
  overLimitRow.appendChild(overLimitInput);
  overLimitRow.appendChild(h('button', {
    class: 'btn-suggest',
    onclick: () => {
      if (!state.selectedCardId) {
        alert('Please select a card first');
        return;
      }
      const card = state.cards.find(c => c.id === state.selectedCardId);
      if (!card || !card.limit) {
        alert('Selected card has no credit limit set');
        return;
      }
      const currentBalanceInput = document.getElementById('current-balance-input');
      const currentBalance = parseFloat(currentBalanceInput?.value) || 0;
      const overLimit = Math.max(0, currentBalance - card.limit);
      overLimitInput.value = overLimit.toFixed(2);
    }
  }, 'Auto'));
  grid.appendChild(renderField('Over Limit', overLimitRow));
  
  form.appendChild(grid);
  
  // Notes (uncontrolled)
  form.appendChild(renderField('Notes', h('textarea', {
    id: 'notes-input',
    value: state.draft.notes || '',
    maxlength: '500',
    rows: '3',
    placeholder: 'Optional notes...'
  })));
  
  // Actions
  const actions_row = h('div', { class: 'form-actions' });
  actions_row.appendChild(h('button', {
    class: 'btn-primary',
    onclick: () => actions.saveEntry()
  }, 'Save Entry'));
  actions_row.appendChild(h('button', {
    class: 'btn-secondary',
    onclick: () => actions.clearDraft()
  }, 'Clear'));
  form.appendChild(actions_row);
  
  return form;
}

function renderHistoryFilters(state, actions) {
  const filters = h('div', { class: 'history-filters' });
  
  // Show selector
  const showSelect = h('select', {},
    h('option', { value: 'selected' }, state.selectedCardId ? 'Selected Card' : 'All Cards'),
    h('option', { value: 'all' }, 'All Cards')
  );
  filters.appendChild(h('label', {}, 'Show: ', showSelect));
  
  // Date range (placeholder for future)
  // filters.appendChild(h('label', {}, 'From: ', h('input', { type: 'date' })));
  // filters.appendChild(h('label', {}, 'To: ', h('input', { type: 'date' })));
  
  return filters;
}

function renderHistoryTable(state, actions) {
  // Filter entries
  let entries = state.entries;
  if (state.selectedCardId) {
    entries = entries.filter(e => e.cardId === state.selectedCardId);
  }
  
  // Sort by date DESC
  entries = entries.slice().sort((a, b) => b.date.localeCompare(a.date));
  
  // Show first 100
  const displayed = entries.slice(0, Math.min(100, entries.length));
  
  if (!displayed.length) {
    return h('div', { class: 'muted' }, 'No entries yet');
  }
  
  const table = h('table', { class: 'history-table' });
  
  // Header
  const thead = h('thead');
  const headerRow = h('tr');
  ['Date', 'Card', 'Current Balance', 'Remaining Stmt', 'Min Payment', 'Available', 'Stmt End', 'Due Date', 'Notes', ''].forEach(label => {
    headerRow.appendChild(h('th', {}, label));
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Body
  const tbody = h('tbody');
  displayed.forEach(entry => {
    const card = state.cards.find(c => c.id === entry.cardId);
    const row = h('tr');
    
    row.appendChild(h('td', {}, entry.date));
    row.appendChild(h('td', {}, card ? card.name : 'Unknown'));
    row.appendChild(h('td', {}, fmtUSD(entry.currentBalance)));
    row.appendChild(h('td', {}, fmtUSD(entry.remainingStmt)));
    row.appendChild(h('td', {}, fmtUSD(entry.minPayment)));
    row.appendChild(h('td', {}, fmtUSD(entry.availableCredit)));
    row.appendChild(h('td', {}, entry.statementEnd || '--'));
    row.appendChild(h('td', {}, entry.dueDate || '--'));
    row.appendChild(h('td', { class: 'notes-cell' }, entry.notes || '--'));
    
    const deleteBtn = h('button', {
      class: 'btn-delete small',
      onclick: () => {
        if (confirm('Delete this entry?')) {
          actions.deleteEntry(entry.id);
        }
      }
    }, '🗑️');
    row.appendChild(h('td', {}, deleteBtn));
    
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  
  const container = h('div');
  container.appendChild(table);
  
  // Load more button (placeholder)
  if (entries.length > 100) {
    container.appendChild(h('button', { class: 'btn-secondary' }, 'Load 100 More'));
  }
  
  return container;
}

function renderField(label, input) {
  return h('div', { class: 'field' },
    h('label', {}, label),
    input
  );
}
