import { h, uid } from './dom-utils.js';
import { fmtUSD } from './utils.js';

const PRESET_COLORS = [
  '#4F7CFF', '#FF6B6B', '#51CF66', '#FFD43B', 
  '#9775FA', '#FF8787', '#339AF0', '#FFA94D'
];

export function renderCards(state, actions) {
  const container = h('div', { class: 'cards-page' });
  
  // Header with Add button
  const header = h('div', { class: 'page-header' },
    h('h2', {}, 'Credit Cards'),
    h('button', { class: 'btn-primary', onclick: () => actions.addCard() }, '+ Add Card')
  );
  container.appendChild(header);
  
  if (!state.cards.length) {
    container.appendChild(h('div', { class: 'muted' }, 'No cards yet. Click "Add Card" to get started.'));
    return container;
  }
  
  // Render each card form
  state.cards.forEach(card => {
    container.appendChild(renderCardForm(card, state, actions));
  });
  
  return container;
}

function renderCardForm(card, state, actions) {
  const panel = h('div', { class: 'panel card-form' });
  
  // Header
  const header = h('div', { class: 'card-form-header' },
    h('h3', {}, card.name || 'New Card'),
    h('button', { 
      class: 'btn-delete',
      onclick: () => {
        if (confirm(`Delete card "${card.name}"?`)) {
          actions.deleteCard(card.id);
        }
      }
    }, '🗑️ Delete')
  );
  panel.appendChild(header);
  
  // Form fields in 2-column grid
  const grid = h('div', { class: 'form-grid' });
  
  // Card Name
  grid.appendChild(renderField('Card Name', h('input', {
    type: 'text',
    value: card.name,
    maxlength: '50',
    oninput: (e) => actions.updateCard(card.id, { name: e.target.value })
  })));
  
  // Issuer
  grid.appendChild(renderField('Issuer', h('select', {
    value: card.issuer,
    onchange: (e) => actions.updateCard(card.id, { issuer: e.target.value })
  },
    h('option', { value: 'Chase' }, 'Chase'),
    h('option', { value: 'AmEx' }, 'AmEx'),
    h('option', { value: 'Other' }, 'Other')
  )));
  
  // Credit Limit
  grid.appendChild(renderField('Credit Limit', h('input', {
    type: 'number',
    value: card.limit || '',
    min: '0',
    step: '100',
    placeholder: '0',
    oninput: (e) => actions.updateCard(card.id, { limit: parseFloat(e.target.value) || 0 })
  })));
  
  // APR %
  grid.appendChild(renderField('APR %', h('input', {
    type: 'number',
    value: card.apr || '',
    min: '0',
    max: '100',
    step: '0.01',
    placeholder: '0',
    oninput: (e) => actions.updateCard(card.id, { apr: parseFloat(e.target.value) || 0 })
  })));
  
  // Utilization Target %
  grid.appendChild(renderField('Utilization Target %', h('input', {
    type: 'number',
    value: card.utilTarget || '',
    min: '0',
    max: '100',
    step: '1',
    placeholder: '30',
    oninput: (e) => actions.updateCard(card.id, { utilTarget: parseFloat(e.target.value) || 30 })
  })));
  
  // Card Color
  const colorField = h('div', { class: 'field' });
  colorField.appendChild(h('label', {}, 'Card Color'));
  
  const colorRow = h('div', { class: 'color-picker' });
  
  // Color input
  const colorInput = h('input', {
    type: 'color',
    value: card.color,
    oninput: (e) => actions.updateCard(card.id, { color: e.target.value })
  });
  colorRow.appendChild(colorInput);
  
  // Preset colors
  const presets = h('div', { class: 'color-presets' });
  PRESET_COLORS.forEach(color => {
    const btn = h('button', {
      class: 'color-preset' + (card.color === color ? ' active' : ''),
      style: { backgroundColor: color },
      onclick: () => {
        actions.updateCard(card.id, { color });
        colorInput.value = color;
      }
    });
    presets.appendChild(btn);
  });
  colorRow.appendChild(presets);
  
  colorField.appendChild(colorRow);
  grid.appendChild(colorField);
  
  panel.appendChild(grid);
  
  return panel;
}

function renderField(label, input) {
  return h('div', { class: 'field' },
    h('label', {}, label),
    input
  );
}
