import { h, uid } from './dom-utils.js';
import { fmtUSD, todayISO, getLatestEntry } from './utils.js';
import {
  FORM_IDS,
  MAX_NOTES_LENGTH,
  MAX_HISTORY_ENTRIES,
  EMPTY_STATES,
  VALIDATION_MESSAGES
} from './constants.js';

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
    form.appendChild(h('div', { class: 'muted' }, EMPTY_STATES.NO_CARDS_FOR_LOG));
    return form;
  }
  
  const grid = h('div', { class: 'form-grid' });
  
  // Card selector (controlled - dropdowns don't have focus issues)
  const cardSelect = h('select', {
    id: FORM_IDS.CARD_SELECT,
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
    id: FORM_IDS.DATE_INPUT,
    value: state.draft.date || todayISO()
  });
  grid.appendChild(renderField('Date *', dateInput));
  
  // Due Date with Suggest button (uncontrolled)
  const dueDateInput = h('input', {
    type: 'date',
    id: FORM_IDS.DUE_DATE_INPUT,
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
    id: FORM_IDS.CURRENT_BALANCE_INPUT,
    value: state.draft.currentBalance || '',
    min: '0',
    step: '0.01',
    placeholder: '0.00'
  })));

  // Remaining Statement Balance (uncontrolled)
  grid.appendChild(renderField('Remaining Stmt Balance', h('input', {
    type: 'number',
    id: FORM_IDS.REMAINING_STMT_INPUT,
    value: state.draft.remainingStmt || '',
    min: '0',
    step: '0.01',
    placeholder: '0.00'
  })));

  // Available Credit (uncontrolled)
  grid.appendChild(renderField('Available Credit', h('input', {
    type: 'number',
    id: FORM_IDS.AVAILABLE_CREDIT_INPUT,
    value: state.draft.availableCredit || '',
    min: '0',
    step: '0.01',
    placeholder: '0.00'
  })));
  
  // Statement End with Suggest button (uncontrolled)
  const stmtEndInput = h('input', {
    type: 'date',
    id: FORM_IDS.STMT_END_INPUT,
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
    id: FORM_IDS.MIN_PAYMENT_INPUT,
    value: state.draft.minPayment || '',
    min: '0',
    step: '0.01',
    placeholder: '0.00'
  })));
  
  // Over Limit with Auto Calculate button (uncontrolled)
  const overLimitInput = h('input', {
    type: 'number',
    id: FORM_IDS.OVER_LIMIT_INPUT,
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
        alert(VALIDATION_MESSAGES.NO_CARD_SELECTED);
        return;
      }
      const card = state.cards.find(c => c.id === state.selectedCardId);
      if (!card || !card.limit) {
        alert(VALIDATION_MESSAGES.CARD_NO_LIMIT);
        return;
      }
      const currentBalanceInput = document.getElementById(FORM_IDS.CURRENT_BALANCE_INPUT);
      const currentBalance = parseFloat(currentBalanceInput?.value) || 0;
      const overLimit = Math.max(0, currentBalance - card.limit);
      overLimitInput.value = overLimit > 0 ? overLimit.toFixed(2) : '';
    }
  }, 'Auto'));
  grid.appendChild(renderField('Over Limit', overLimitRow));
  
  form.appendChild(grid);
  
  // Notes (uncontrolled)
  form.appendChild(renderField('Notes', h('textarea', {
    id: FORM_IDS.NOTES_INPUT,
    value: state.draft.notes || '',
    maxlength: MAX_NOTES_LENGTH.toString(),
    rows: '3',
    placeholder: 'Optional notes...'
  })));
  
  // Actions
  const actions_row = h('div', { class: 'form-actions' });

  // Show different button text based on editing mode
  const isEditing = state.editingEntryId !== null;
  actions_row.appendChild(h('button', {
    class: 'btn-primary',
    onclick: () => actions.saveEntry()
  }, isEditing ? 'Update Entry' : 'Save Entry'));

  // Show Cancel button when editing, Clear when creating
  actions_row.appendChild(h('button', {
    class: 'btn-secondary',
    onclick: () => isEditing ? actions.cancelEdit() : actions.clearDraft()
  }, isEditing ? 'Cancel' : 'Clear'));

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
  
  // Show first MAX_HISTORY_ENTRIES
  const displayed = entries.slice(0, Math.min(MAX_HISTORY_ENTRIES, entries.length));
  
  if (!displayed.length) {
    return h('div', { class: 'muted' }, EMPTY_STATES.NO_ENTRIES);
  }
  
  const table = h('table', { class: 'history-table' });
  
  // Header
  const thead = h('thead');
  const headerRow = h('tr');
  ['Date', 'Card', 'Current Balance', 'Remaining Stmt', 'Min Payment', 'Available', 'Stmt End', 'Due Date', 'Notes', 'Actions'].forEach(label => {
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

    // Actions cell with edit and delete buttons
    const actionsCell = h('td', { class: 'actions-cell' });

    const editBtn = h('button', {
      class: 'btn-edit small',
      onclick: () => {
        actions.startEditingEntry(entry.id);
        // Scroll to the form
        const form = document.getElementById('entry-form');
        if (form) {
          form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      },
      title: 'Edit entry'
    }, '✏️');
    actionsCell.appendChild(editBtn);

    const deleteBtn = h('button', {
      class: 'btn-delete small',
      onclick: () => {
        if (confirm('Delete this entry?')) {
          actions.deleteEntry(entry.id);
        }
      },
      title: 'Delete entry'
    }, '🗑️');
    actionsCell.appendChild(deleteBtn);

    row.appendChild(actionsCell);

    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  
  const container = h('div');
  container.appendChild(table);
  
  // Load more button (placeholder)
  if (entries.length > MAX_HISTORY_ENTRIES) {
    const remaining = entries.length - MAX_HISTORY_ENTRIES;
    container.appendChild(h('button', { class: 'btn-secondary' }, `Load ${Math.min(remaining, MAX_HISTORY_ENTRIES)} More`));
  }
  
  return container;
}

function renderField(label, input) {
  return h('div', { class: 'field' },
    h('label', {}, label),
    input
  );
}
