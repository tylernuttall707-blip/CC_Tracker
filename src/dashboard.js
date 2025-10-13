import { h } from './dom-utils.js';
import { fmtUSD, fmtPercent, getLatestEntries, calcUtilization, calcDaysTillDue, calcClosesIn, calcEstInterest, todayISO, daysBetween } from './utils.js';

export function renderDashboard(state, actions) {
  const container = h('div', { class: 'dashboard' });
  
  // KPIs Section
  container.appendChild(h('section', { class: 'panel' },
    h('h2', {}, 'Overview'),
    renderKPIs(state)
  ));
  
  // Utilization Order Table
  container.appendChild(h('section', { class: 'panel' },
    h('h2', {}, 'Utilization Order'),
    renderUtilizationTable(state, actions)
  ));
  
  // Payment Calendar
  container.appendChild(h('section', { class: 'panel' },
    h('h2', {}, 'Payment Calendar'),
    renderPaymentCalendar(state)
  ));
  
  // Cards Overview
  container.appendChild(h('section', { class: 'panel' },
    h('h2', {}, 'Cards Overview'),
    renderCardsOverview(state, actions)
  ));
  
  return container;
}

function renderKPIs(state) {
  const latestEntries = getLatestEntries(state.cards, state.entries);
  
  let totalBalance = 0;
  let totalAvailable = 0;
  let totalRemaining = 0;
  let utilizationSum = 0;
  let dueSoon = 0;
  let overLimitCount = 0;
  
  state.cards.forEach(card => {
    const entry = latestEntries.get(card.id);
    if (!entry) return;
    
    totalBalance += entry.currentBalance || 0;
    totalAvailable += entry.availableCredit || 0;
    totalRemaining += entry.remainingStmt || 0;
    utilizationSum += calcUtilization(entry, card);
    
    const daysTillDue = calcDaysTillDue(entry);
    if (daysTillDue !== null && daysTillDue <= 7) {
      dueSoon += entry.remainingStmt || 0;
    }
    
    if (entry.overLimit && entry.overLimit > 0) {
      overLimitCount++;
    }
  });
  
  const avgUtilization = state.cards.length > 0 ? utilizationSum / state.cards.length : 0;
  
  const grid = h('div', { class: 'kpi-grid' });
  
  grid.appendChild(renderKPI('Total Balance', fmtUSD(totalBalance)));
  grid.appendChild(renderKPI('Total Available', fmtUSD(totalAvailable)));
  grid.appendChild(renderKPI('Total Remaining', fmtUSD(totalRemaining)));
  grid.appendChild(renderKPI('Avg Utilization', fmtPercent(avgUtilization)));
  grid.appendChild(renderKPI('Due Soon (≤7d)', fmtUSD(dueSoon)));
  grid.appendChild(renderKPI('Over Limit', overLimitCount.toString()));
  
  return grid;
}

function renderKPI(label, value) {
  return h('div', { class: 'kpi' },
    h('div', { class: 'kpi-label' }, label),
    h('div', { class: 'kpi-value' }, value)
  );
}

function renderUtilizationTable(state, actions) {
  if (!state.cards.length) {
    return h('div', { class: 'muted' }, 'No cards added yet');
  }
  
  const latestEntries = getLatestEntries(state.cards, state.entries);
  
  // Build array of {card, utilization}
  const items = state.cards.map(card => {
    const entry = latestEntries.get(card.id);
    const utilization = entry ? calcUtilization(entry, card) : 0;
    return { card, utilization };
  }).sort((a, b) => b.utilization - a.utilization);
  
  const table = h('table', { class: 'util-table' });
  
  // Header
  const thead = h('thead');
  const headerRow = h('tr');
  headerRow.appendChild(h('th', {}, 'Card'));
  headerRow.appendChild(h('th', {}, 'Utilization'));
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Body
  const tbody = h('tbody');
  items.forEach(item => {
    const row = h('tr');
    const nameCell = h('td', { class: 'link' }, item.card.name);
    nameCell.onclick = () => {
      actions.selectCard(item.card.id);
      actions.setView('log');
    };
    row.appendChild(nameCell);
    row.appendChild(h('td', {}, fmtPercent(item.utilization)));
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  
  return table;
}

function renderPaymentCalendar(state) {
  const today = new Date();
  
  // Find the start of this week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  const calendar = h('div', { class: 'calendar' });
  
  // Day headers
  const headerRow = h('div', { class: 'calendar-row' });
  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
    headerRow.appendChild(h('div', { class: 'calendar-header' }, day));
  });
  calendar.appendChild(headerRow);
  
  // 4 weeks = 28 days
  for (let week = 0; week < 4; week++) {
    const row = h('div', { class: 'calendar-row' });
    for (let day = 0; day < 7; day++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + week * 7 + day);
      
      const dateStr = date.toISOString().split('T')[0];
      const isToday = dateStr === todayISO();
      
      // Find cards with due dates on this day
      const latestEntries = getLatestEntries(state.cards, state.entries);
      const dueCards = [];
      state.cards.forEach(card => {
        const entry = latestEntries.get(card.id);
        if (entry && entry.dueDate === dateStr) {
          dueCards.push({ card, entry });
        }
      });
      
      const cell = h('div', { class: 'calendar-cell' + (isToday ? ' today' : '') });
      cell.appendChild(h('div', { class: 'calendar-date' }, date.getDate().toString()));
      
      if (dueCards.length > 0) {
        const dots = h('div', { class: 'calendar-dots' });
        dueCards.forEach(({ card, entry }) => {
          const dot = h('div', {
            class: 'calendar-dot',
            style: { backgroundColor: card.color },
            title: `${card.name}: ${fmtUSD(entry.remainingStmt || 0)}`
          });
          dots.appendChild(dot);
        });
        cell.appendChild(dots);
      }
      
      row.appendChild(cell);
    }
    calendar.appendChild(row);
  }
  
  return calendar;
}

function renderCardsOverview(state, actions) {
  if (!state.cards.length) {
    return h('div', { class: 'muted' }, 'No cards added yet');
  }
  
  const latestEntries = getLatestEntries(state.cards, state.entries);
  
  const grid = h('div', { class: 'cards-grid' });
  
  state.cards.forEach(card => {
    const entry = latestEntries.get(card.id);
    grid.appendChild(renderCardPanel(card, entry, actions));
  });
  
  return grid;
}

function renderCardPanel(card, entry, actions) {
  const panel = h('div', { class: 'card-panel', style: { borderLeft: `4px solid ${card.color}` } });
  
  // Header
  panel.appendChild(h('h3', {}, card.name));
  panel.appendChild(h('div', { class: 'muted small' }, `${card.issuer} • ${fmtUSD(card.limit)}`));
  
  if (!entry) {
    panel.appendChild(h('div', { class: 'muted' }, 'No entries yet'));
  } else {
    // Metrics
    const utilization = calcUtilization(entry, card);
    const daysTillDue = calcDaysTillDue(entry);
    const closesIn = calcClosesIn(entry);
    const estInterest = calcEstInterest(entry, card);
    
    const metrics = h('div', { class: 'card-metrics' });
    
    metrics.appendChild(renderMetric('Current Balance', fmtUSD(entry.currentBalance)));
    metrics.appendChild(renderMetric('Remaining Stmt', fmtUSD(entry.remainingStmt)));
    metrics.appendChild(renderMetric('Min Payment', fmtUSD(entry.minPayment)));
    metrics.appendChild(renderMetric('Available Credit', fmtUSD(entry.availableCredit)));
    
    if (entry.overLimit && entry.overLimit > 0) {
      metrics.appendChild(h('div', { class: 'badge badge-red' }, `Over by ${fmtUSD(entry.overLimit)}`));
    }
    
    metrics.appendChild(renderMetric('Utilization', fmtPercent(utilization)));
    metrics.appendChild(renderMetric('Target', fmtPercent(card.utilTarget)));
    
    if (utilization >= card.utilTarget) {
      metrics.appendChild(h('div', { class: 'badge badge-yellow' }, `≥ Target ${fmtPercent(card.utilTarget)}`));
    }
    
    if (entry.dueDate) {
      metrics.appendChild(renderMetric('Due Date', entry.dueDate));
      if (daysTillDue !== null) {
        metrics.appendChild(renderMetric('Days till Due', daysTillDue.toString()));
      }
    }
    
    if (entry.statementEnd) {
      metrics.appendChild(renderMetric('Statement Close', entry.statementEnd));
      if (closesIn !== null) {
        metrics.appendChild(renderMetric('Closes in', closesIn.toString() + ' days'));
      }
    }
    
    metrics.appendChild(renderMetric('Est. Interest', fmtUSD(estInterest)));
    
    panel.appendChild(metrics);
  }
  
  // Log button
  const logBtn = h('button', { class: 'btn-secondary small' }, 'Log');
  logBtn.onclick = () => {
    actions.selectCard(card.id);
    actions.setView('log');
  };
  panel.appendChild(logBtn);
  
  return panel;
}

function renderMetric(label, value) {
  return h('div', { class: 'metric' },
    h('div', { class: 'metric-label' }, label),
    h('div', { class: 'metric-value' }, value)
  );
}
