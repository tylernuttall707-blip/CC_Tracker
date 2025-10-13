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
  const form = h('div', { class: 'entry-form' });
  
  if (!state.cards.length) {
    form.appendChild(h('div', { class: 'muted' }, 'Please add a card first.'));
    return form;
  }
  
  const grid = h('div', { class: 'form-grid' });
  
  // Card selector
  const cardSelect = h('select', {
    value: state.selectedCardId || '',
    onchange: (e) => actions.selectCard(e.target.value)
  },
    h('option', { value: '' }, '-- Select Card --'),
    ...state.cards.map(c => h('option', { value: c.id }, c.name))
  );
  grid.appendChild(renderField('Card *', cardSelect));
  
  // Date
  grid.appendChild(renderField('Date *', h('input', {
    type: 'date',
    value: state.draft.date,
    oninput: (e) => actions.updateDraft({ date: e.target.value })
  })));
  
  // Due Date with Suggest button
  const dueDateRow = h('div', { class: 'field-row' });
  dueDateRow.appendChild(h('input', {
    type: 'date',
    value: state.draft.dueDate,
    oninput: (e) => actions.updateDraft({ dueDate: e.target.value })
  }));
  dueDateRow.appendChild(h('button', {
    class: 'btn-suggest',
    onclick: () => {
      if (!state.selectedCardId) return;
      const latest = getLatestEntry(state.selectedCardId, state.entries);
      if (latest && latest.dueDate) {
        actions.updateDraft({ dueDate: latest.dueDate });
      }
    }
  }, 'Suggest'));
  grid.appendChild(renderField('Due Date', dueDateRow));
  
  // Current Balance
  grid.appendChild(renderField('Current Balance *', h('input', {
    type: 'number',
    value: state.draft.currentBalance,
    min: '0',
    step: '0.01',
    placeholder: '0.00',
    oninput: (e) => actions.updateDraft({ currentBalance: e.target.value })
  })));
  
  // Remaining Statement Balance
  grid.appendChild(renderField('Remaining Stmt Balance', h('input', {
    type: 'number',
    value: state.draft.remainingStmt,
    min: '0',
    step: '0.01',
    placeholder: '0.00',
    oninput: (e) => actions.updateDraft({ remainingStmt: e.target.value })
  })));
  
  // Available Credit
  grid.appendChild(renderField('Available Credit', h('input', {
    type: 'number',
    value: state.draft.availableCredit,
    min: '0',
    step: '0.01',
    placeholder: '0.00',
    oninput: (e) => actions.updateDraft({ availableCredit: e.target.value })
  })));
  
  // Statement End with Suggest button
  const stmtEndRow = h('div', { class: 'field-row' });
  stmtEndRow.appendChild(h('input', {
    type: 'date',
    value: state.draft.statementEnd,
    oninput: (e) => actions.updateDraft({ statementEnd: e.target.value })
  }));
  stmtEndRow.appendChild(h('button', {
    class: 'btn-suggest',
    onclick: () => {
      if (!state.selectedCardId) return;
      const latest = getLatestEntry(state.selectedCardId, state.entries);
      if (latest && latest.statementEnd) {
        actions.updateDraft({ statementEnd: latest.statementEnd });
      }
    }
  }, 'Suggest'));
  grid.appendChild(renderField('Statement End', stmtEndRow));
  
  // Minimum Payment
  grid.appendChild(renderField('Minimum Payment', h('input', {
    type: 'number',
    value: state.draft.minPayment,
    min: '0',
    step: '0.01',
    placeholder: '0.00',
    oninput: (e) => actions.updateDraft({ minPayment: e.target.value })
  })));
  
  // Over Limit
  grid.appendChild(renderField('Over Limit', h('input', {
    type: 'number',
    value: state.draft.overLimit,
    min: '0',
    step: '0.01',
    placeholder: '0.00',
    oninput: (e) => actions.updateDraft({ overLimit: e.target.value })
  })));
  
  form.appendChild(grid);
  
  // Notes (full width)
  form.appendChild(renderField('Notes', h('textarea', {
    value: state.draft.notes,
    maxlength: '500',
    rows: '3',
    placeholder: 'Optional notes...',
    oninput: (e) => actions.updateDraft({ notes: e.target.value })
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
