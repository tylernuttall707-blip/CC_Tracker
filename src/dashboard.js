import { h } from './dom-utils.js';
import { fmtUSD, fmtPercent, getLatestEntries, calcUtilization, calcDaysTillDue, calcClosesIn, calcEstInterest, todayISO, daysBetween } from './utils.js';

export function renderDashboard(state, actions) {
  const container = h('div', { class: 'dashboard' });
  
  // Header with print button
  const header = h('div', { class: 'dashboard-header' },
    h('h1', {}, 'Dashboard'),
    h('button', {
      class: 'btn-secondary print-btn',
      onclick: () => window.print()
    }, '🖨️ Print')
  );
  container.appendChild(header);
  
  // Top section: 3-column layout
  const topSection = h('div', { class: 'dashboard-top' });
  
  // Left column - KPIs
  topSection.appendChild(h('section', { class: 'panel dashboard-kpis' },
    h('h2', {}, 'KPIs'),
    renderKPIs(state)
  ));
  
  // Middle column - Utilization Order
  topSection.appendChild(h('section', { class: 'panel dashboard-util' },
    h('h2', {}, 'Utilization Order'),
    renderUtilizationTable(state, actions)
  ));
  
  // Right column - Payment Calendar
  topSection.appendChild(h('section', { class: 'panel dashboard-calendar' },
    h('h2', {}, 'Payment Calendar (next 4 weeks)'),
    renderPaymentCalendar(state)
  ));
  
  container.appendChild(topSection);
  
  // Bottom section: Cards Overview (full width)
  container.appendChild(h('section', { class: 'panel dashboard-cards' },
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
        const items = h('div', { class: 'calendar-items' });
        dueCards.forEach(({ card, entry }) => {
          const item = h('div', { class: 'calendar-item' });
          const dot = h('span', {
            class: 'calendar-dot',
            style: { backgroundColor: card.color }
          });
          const label = h('span', { class: 'calendar-label' }, card.name);
          item.appendChild(dot);
          item.appendChild(label);
          items.appendChild(item);
        });
        cell.appendChild(items);
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
  
  // Header with card name
  panel.appendChild(h('h3', {}, card.name));
  panel.appendChild(h('div', { class: 'card-issuer' }, `${card.issuer} • Limit: ${fmtUSD(card.limit)}`));
  
  // Log button (top right)
  const logBtn = h('button', { class: 'btn-secondary small log-btn' }, 'Log');
  logBtn.onclick = () => {
    actions.selectCard(card.id);
    actions.setView('log');
  };
  panel.appendChild(logBtn);
  
  if (!entry) {
    panel.appendChild(h('div', { class: 'muted' }, 'No entries yet'));
    return panel;
  }
  
  // Calculate metrics
  const utilization = calcUtilization(entry, card);
  const daysTillDue = calcDaysTillDue(entry);
  const closesIn = calcClosesIn(entry);
  const estInterest = calcEstInterest(entry, card);
  
  // Badges section
  const badges = h('div', { class: 'card-badges' });
  if (entry.overLimit && entry.overLimit > 0) {
    badges.appendChild(h('div', { class: 'badge badge-red' }, `Over by ${fmtUSD(entry.overLimit)}`));
  }
  if (utilization >= card.utilTarget) {
    badges.appendChild(h('div', { class: 'badge badge-yellow' }, `≥ Target ${fmtPercent(card.utilTarget)}`));
  }
  if (badges.children.length > 0) {
    panel.appendChild(badges);
  }
  
  // Metrics organized in rows
  const metrics = h('div', { class: 'card-metrics' });
  
  // Row 1: Current Balance & Remaining Statement Balance
  const row1 = h('div', { class: 'card-metrics-row' });
  row1.appendChild(renderMetric('Current Balance', fmtUSD(entry.currentBalance)));
  row1.appendChild(renderMetric('Remaining Statement Balance', fmtUSD(entry.remainingStmt)));
  metrics.appendChild(row1);
  
  // Row 2: Min Payment & Available
  const row2 = h('div', { class: 'card-metrics-row' });
  row2.appendChild(renderMetric('Min Payment', fmtUSD(entry.minPayment)));
  row2.appendChild(renderMetric('Available', entry.availableCredit ? fmtUSD(entry.availableCredit) : '$0.00'));
  metrics.appendChild(row2);
  
  // Row 3: Over Limit & Utilization
  const row3 = h('div', { class: 'card-metrics-row' });
  row3.appendChild(renderMetric('Over Limit', entry.overLimit && entry.overLimit > 0 ? fmtUSD(entry.overLimit) : '—'));
  row3.appendChild(renderMetric('Utilization', fmtPercent(utilization)));
  metrics.appendChild(row3);
  
  // Row 4: Util Target & Due Date
  const row4 = h('div', { class: 'card-metrics-row' });
  row4.appendChild(renderMetric('Util Target', fmtPercent(card.utilTarget)));
  row4.appendChild(renderMetric('Due Date', entry.dueDate || '—'));
  metrics.appendChild(row4);
  
  // Row 5: Days till Due & Statement Close
  const row5 = h('div', { class: 'card-metrics-row' });
  row5.appendChild(renderMetric('Days till Due', daysTillDue !== null ? daysTillDue.toString() : '—'));
  row5.appendChild(renderMetric('Statement Close', entry.statementEnd || '—'));
  metrics.appendChild(row5);
  
  // Row 6: Closes in & Est. Interest
  const row6 = h('div', { class: 'card-metrics-row' });
  row6.appendChild(renderMetric('Closes in', closesIn !== null ? closesIn.toString() : '—'));
  row6.appendChild(renderMetric('Est. Interest (mo)', fmtUSD(estInterest)));
  metrics.appendChild(row6);
  
  panel.appendChild(metrics);
  
  return panel;
}

function renderMetric(label, value) {
  return h('div', { class: 'metric' },
    h('div', { class: 'metric-label' }, label),
    h('div', { class: 'metric-value' }, value)
  );
}
