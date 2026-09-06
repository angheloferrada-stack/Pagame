// ---------- Almacenamiento ----------
const STORAGE_KEY = 'gastos-pwa-data-v1';

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { groups: [] };
  } catch (e) {
    return { groups: [] };
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------- Estado ----------
const state = {
  data: loadData(),
  currentGroupId: null,
};

function getGroup(id) {
  return state.data.groups.find((g) => g.id === id);
}

// ---------- Utilidades ----------
function formatMoney(n) {
  return '$' + Math.round(n).toLocaleString('es-CL');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove('show'), 2200);
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('[data-close-modal]').forEach((btn) => {
  btn.addEventListener('click', () => {
    btn.closest('.modal').classList.remove('open');
  });
});

// ---------- Navegación de vistas ----------
function showView(id) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ---------- Render: lista de grupos ----------
function renderGroups() {
  const list = document.getElementById('groups-list');
  const empty = document.getElementById('groups-empty');
  list.innerHTML = '';

  if (state.data.groups.length === 0) {
    empty.classList.add('show');
    return;
  }
  empty.classList.remove('show');

  state.data.groups.forEach((g) => {
    const total = g.expenses.reduce((sum, e) => sum + e.amount, 0);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div>
        <div class="card-title">${escapeHtml(g.name)}</div>
        <div class="card-sub">${g.members.length} amigos · ${g.expenses.length} gastos</div>
      </div>
      <div class="card-amount">${formatMoney(total)}</div>
    `;
    card.addEventListener('click', () => openGroup(g.id));
    list.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Crear grupo ----------
document.getElementById('btn-new-group').addEventListener('click', () => {
  document.getElementById('form-new-group').reset();
  openModal('modal-new-group');
});

document.getElementById('form-new-group').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('input-group-name').value.trim();
  const membersRaw = document.getElementById('input-group-members').value;
  const members = membersRaw
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)
    .map((m) => ({ id: uid(), name: m }));

  if (!name || members.length < 2) {
    showToast('Ingresa al menos 2 amigos');
    return;
  }

  const group = { id: uid(), name, members, expenses: [] };
  state.data.groups.push(group);
  saveData();
  closeModal('modal-new-group');
  renderGroups();
  openGroup(group.id);
});

// ---------- Detalle de grupo ----------
function openGroup(id) {
  state.currentGroupId = id;
  const g = getGroup(id);
  document.getElementById('group-title').textContent = g.name;
  showView('view-group');
  switchTab('gastos');
  renderExpenses();
  renderMembers();
  renderBalance();
}

document.getElementById('btn-back-group').addEventListener('click', () => {
  state.currentGroupId = null;
  showView('view-groups');
  renderGroups();
});

// Tabs
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + name));
  if (name === 'balance') renderBalance();
}

// ---------- Menú de grupo (eliminar) ----------
document.getElementById('btn-group-menu').addEventListener('click', () => {
  const g = getGroup(state.currentGroupId);
  document.getElementById('group-menu-title').textContent = g.name;
  openModal('modal-group-menu');
});

document.getElementById('btn-delete-group').addEventListener('click', () => {
  if (!confirm('¿Eliminar este grupo y todos sus gastos?')) return;
  state.data.groups = state.data.groups.filter((g) => g.id !== state.currentGroupId);
  saveData();
  closeModal('modal-group-menu');
  state.currentGroupId = null;
  showView('view-groups');
  renderGroups();
});

// ---------- Miembros ----------
function renderMembers() {
  const g = getGroup(state.currentGroupId);
  const list = document.getElementById('members-list');
  list.innerHTML = '';
  g.members.forEach((m) => {
    const row = document.createElement('div');
    row.className = 'member-row';
    row.innerHTML = `<span>${escapeHtml(m.name)}</span>`;
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Quitar';
    delBtn.addEventListener('click', () => removeMember(m.id));
    row.appendChild(delBtn);
    list.appendChild(row);
  });
}

function removeMember(memberId) {
  const g = getGroup(state.currentGroupId);
  const usedInExpense = g.expenses.some(
    (e) => e.payerId === memberId || e.participantIds.includes(memberId)
  );
  if (usedInExpense) {
    showToast('No se puede quitar: tiene gastos asociados');
    return;
  }
  g.members = g.members.filter((m) => m.id !== memberId);
  saveData();
  renderMembers();
}

document.getElementById('form-add-member').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('input-member-name');
  const name = input.value.trim();
  if (!name) return;
  const g = getGroup(state.currentGroupId);
  g.members.push({ id: uid(), name });
  saveData();
  input.value = '';
  renderMembers();
});

// ---------- Gastos ----------
document.getElementById('btn-new-expense').addEventListener('click', () => {
  const g = getGroup(state.currentGroupId);
  if (g.members.length < 2) {
    showToast('Agrega al menos 2 miembros primero');
    return;
  }
  document.getElementById('form-new-expense').reset();

  const payerSelect = document.getElementById('select-expense-payer');
  payerSelect.innerHTML = g.members
    .map((m) => `<option value="${m.id}">${escapeHtml(m.name)}</option>`)
    .join('');

  const participantsDiv = document.getElementById('expense-participants');
  participantsDiv.innerHTML = g.members
    .map(
      (m) => `
      <div class="checkbox-item">
        <input type="checkbox" id="chk-${m.id}" value="${m.id}" checked />
        <label for="chk-${m.id}">${escapeHtml(m.name)}</label>
      </div>`
    )
    .join('');

  openModal('modal-new-expense');
});

document.getElementById('form-new-expense').addEventListener('submit', (e) => {
  e.preventDefault();
  const desc = document.getElementById('input-expense-desc').value.trim();
  const amount = parseFloat(document.getElementById('input-expense-amount').value);
  const payerId = document.getElementById('select-expense-payer').value;
  const participantIds = Array.from(
    document.querySelectorAll('#expense-participants input:checked')
  ).map((el) => el.value);

  if (!desc || !amount || amount <= 0) {
    showToast('Completa descripción y monto válido');
    return;
  }
  if (participantIds.length === 0) {
    showToast('Selecciona al menos un participante');
    return;
  }

  const g = getGroup(state.currentGroupId);
  g.expenses.push({
    id: uid(),
    desc,
    amount,
    payerId,
    participantIds,
    date: new Date().toISOString(),
  });
  saveData();
  closeModal('modal-new-expense');
  renderExpenses();
});

function renderExpenses() {
  const g = getGroup(state.currentGroupId);
  const list = document.getElementById('expenses-list');
  const empty = document.getElementById('expenses-empty');
  list.innerHTML = '';

  if (g.expenses.length === 0) {
    empty.classList.add('show');
    return;
  }
  empty.classList.remove('show');

  const memberName = (id) => (g.members.find((m) => m.id === id) || {}).name || '???';

  [...g.expenses].reverse().forEach((exp) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div>
        <div class="card-title">${escapeHtml(exp.desc)}</div>
        <div class="card-sub">Pagó ${escapeHtml(memberName(exp.payerId))} · entre ${exp.participantIds.length}</div>
      </div>
      <div class="card-amount">${formatMoney(exp.amount)}</div>
    `;
    card.addEventListener('click', () => {
      if (confirm('¿Eliminar este gasto?')) {
        g.expenses = g.expenses.filter((e) => e.id !== exp.id);
        saveData();
        renderExpenses();
      }
    });
    list.appendChild(card);
  });
}

// ---------- Balance y algoritmo de deudas ----------
function computeBalances(group) {
  const balances = {};
  group.members.forEach((m) => (balances[m.id] = 0));

  group.expenses.forEach((exp) => {
    const share = exp.amount / exp.participantIds.length;
    balances[exp.payerId] += exp.amount;
    exp.participantIds.forEach((pid) => {
      balances[pid] -= share;
    });
  });

  return balances; // positivo = le deben, negativo = debe
}

// Simplifica las deudas al mínimo número de transacciones (algoritmo greedy)
function simplifyDebts(balances) {
  const creditors = [];
  const debtors = [];

  Object.entries(balances).forEach(([id, bal]) => {
    if (bal > 0.5) creditors.push({ id, amount: bal });
    else if (bal < -0.5) debtors.push({ id, amount: -bal });
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0.5) {
      settlements.push({ from: debtor.id, to: creditor.id, amount });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.5) i++;
    if (creditor.amount < 0.5) j++;
  }

  return settlements;
}

function renderBalance() {
  const g = getGroup(state.currentGroupId);
  const memberName = (id) => (g.members.find((m) => m.id === id) || {}).name || '???';

  const total = g.expenses.reduce((s, e) => s + e.amount, 0);
  const perPerson = g.members.length ? total / g.members.length : 0;

  document.getElementById('total-summary').innerHTML = `
    <div class="big">${formatMoney(total)}</div>
    <div class="label">gasto total del grupo · ${formatMoney(perPerson)} por persona si se repartiera igual</div>
  `;

  const balances = computeBalances(g);

  const perPersonDiv = document.getElementById('balance-per-person');
  perPersonDiv.innerHTML = '';
  g.members.forEach((m) => {
    const bal = balances[m.id];
    const spent = g.expenses
      .filter((e) => e.payerId === m.id)
      .reduce((s, e) => s + e.amount, 0);
    const row = document.createElement('div');
    row.className = 'card';
    const sign = bal >= 0 ? 'pos' : 'neg';
    const balText = bal >= 0 ? `le deben ${formatMoney(bal)}` : `debe ${formatMoney(-bal)}`;
    row.innerHTML = `
      <div>
        <div class="card-title">${escapeHtml(m.name)}</div>
        <div class="card-sub">Pagó en total ${formatMoney(spent)}</div>
      </div>
      <div class="card-amount ${sign}">${balText}</div>
    `;
    perPersonDiv.appendChild(row);
  });

  const settlements = simplifyDebts(balances);
  const settlementsDiv = document.getElementById('settlements-list');
  const settlementsEmpty = document.getElementById('settlements-empty');
  settlementsDiv.innerHTML = '';

  if (settlements.length === 0) {
    settlementsEmpty.classList.add('show');
  } else {
    settlementsEmpty.classList.remove('show');
    settlements.forEach((s) => {
      const row = document.createElement('div');
      row.className = 'card';
      row.innerHTML = `
        <div>
          <div class="card-title">${escapeHtml(memberName(s.from))} → ${escapeHtml(memberName(s.to))}</div>
          <div class="card-sub">Para que todos paguen lo mismo</div>
        </div>
        <div class="card-amount">${formatMoney(s.amount)}</div>
      `;
      settlementsDiv.appendChild(row);
    });
  }
}

// ---------- Service worker ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// ---------- Init ----------
renderGroups();
