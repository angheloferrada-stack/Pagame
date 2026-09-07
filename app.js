// ---------- Identidad local (solo el nombre, sin login) ----------
function getMyName(groupId) {
  return localStorage.getItem('name-' + groupId) || null;
}
function setMyName(groupId, name) {
  localStorage.setItem('name-' + groupId, name);
}
function getMyGroups() {
  try {
    return JSON.parse(localStorage.getItem('my-groups') || '[]');
  } catch (e) {
    return [];
  }
}
function addMyGroup(groupId) {
  const groups = getMyGroups();
  if (!groups.includes(groupId)) {
    groups.push(groupId);
    localStorage.setItem('my-groups', JSON.stringify(groups));
  }
}
function removeMyGroup(groupId) {
  localStorage.setItem('my-groups', JSON.stringify(getMyGroups().filter((id) => id !== groupId)));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatMoney(n) {
  return '$' + Math.round(n).toLocaleString('es-CL');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove('show'), 2400);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('[data-close-modal]').forEach((btn) => {
  btn.addEventListener('click', () => btn.closest('.modal').classList.remove('open'));
});

function showView(id) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ---------- Estado ----------
const state = {
  currentGroupId: null,
  currentGroup: null,
  unsubscribeCurrent: null,
};

// ---------- Lista de "mis grupos" ----------
async function renderGroups() {
  const list = document.getElementById('groups-list');
  const empty = document.getElementById('groups-empty');
  const ids = getMyGroups();

  if (ids.length === 0) {
    list.innerHTML = '';
    empty.classList.add('show');
    return;
  }
  empty.classList.remove('show');
  list.innerHTML = '<p class="muted" style="padding:0 16px;">Cargando...</p>';

  const docs = await Promise.all(
    ids.map((id) =>
      db.collection('groups').doc(id).get().then((doc) => ({ id, doc })).catch(() => ({ id, doc: null }))
    )
  );

  list.innerHTML = '';
  let anyValid = false;

  docs.forEach(({ id, doc }) => {
    if (!doc || !doc.exists) {
      removeMyGroup(id);
      return;
    }
    anyValid = true;
    const g = doc.data();
    const expenses = g.expenses || [];
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div>
        <div class="card-title">${escapeHtml(g.name)}</div>
        <div class="card-sub">${(g.members || []).length} amigos · ${expenses.length} gastos</div>
      </div>
      <div class="card-amount">${formatMoney(total)}</div>
    `;
    card.addEventListener('click', () => openGroup(id));
    list.appendChild(card);
  });

  if (!anyValid) empty.classList.add('show');
}

// ---------- Crear grupo ----------
document.getElementById('btn-new-group').addEventListener('click', () => {
  document.getElementById('form-new-group').reset();
  openModal('modal-new-group');
});

document.getElementById('form-new-group').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('input-group-name').value.trim();
  const myNameInput = document.getElementById('input-group-my-name');
  const myName = myNameInput ? myNameInput.value.trim() : '';

  if (!name) {
    showToast('Ponle un nombre al grupo');
    return;
  }
  if (!myName) {
    showToast('Escribe tu nombre');
    return;
  }

  const groupId = uid();
  const creatorMember = { id: uid(), name: myName };

  const groupData = {
    name,
    members: [creatorMember],
    expenses: [],
    createdAt: Date.now(),
  };

  try {
    await db.collection('groups').doc(groupId).set(groupData);
  } catch (err) {
    showToast('Error de conexión con Firebase. Revisa firebase-config.js');
    console.error(err);
    return;
  }

  addMyGroup(groupId);
  setMyName(groupId, creatorMember.name);

  closeModal('modal-new-group');
  openGroup(groupId);
});

// ---------- Abrir / suscribirse a un grupo en tiempo real ----------
function openGroup(groupId) {
  if (state.unsubscribeCurrent) {
    state.unsubscribeCurrent();
    state.unsubscribeCurrent = null;
  }

  state.currentGroupId = groupId;
  showView('view-group');
  switchTab('gastos');

  state.unsubscribeCurrent = db.collection('groups').doc(groupId).onSnapshot(
    (doc) => {
      if (!doc.exists) {
        showToast('Este grupo ya no existe');
        removeMyGroup(groupId);
        backToGroups();
        return;
      }
      state.currentGroup = doc.data();
      addMyGroup(groupId);
      document.getElementById('group-title').textContent = state.currentGroup.name;
      renderExpenses();
      renderMembers();
      renderBalance();
    },
    (err) => {
      console.error(err);
      showToast('Error de conexión. Revisa tu configuración de Firebase.');
    }
  );

  const url = new URL(window.location.href);
  url.searchParams.set('group', groupId);
  window.history.replaceState({}, '', url);
}

function backToGroups() {
  if (state.unsubscribeCurrent) {
    state.unsubscribeCurrent();
    state.unsubscribeCurrent = null;
  }
  state.currentGroupId = null;
  state.currentGroup = null;
  const url = new URL(window.location.href);
  url.searchParams.delete('group');
  window.history.replaceState({}, '', url);
  showView('view-groups');
  renderGroups();
}

document.getElementById('btn-back-group').addEventListener('click', backToGroups);

async function updateGroup(partialData) {
  if (!state.currentGroupId) return;
  try {
    await db.collection('groups').doc(state.currentGroupId).update(partialData);
  } catch (err) {
    console.error(err);
    showToast('No se pudo guardar. Revisa tu conexión.');
  }
}

// ---------- Compartir link ----------
document.getElementById('btn-share-group').addEventListener('click', async () => {
  const url = new URL(window.location.href);
  url.searchParams.set('group', state.currentGroupId);
  const link = url.toString();

  if (navigator.share) {
    try {
      await navigator.share({ title: state.currentGroup.name, text: 'Únete a nuestro grupo de gastos', url: link });
      return;
    } catch (e) { /* cancelado, seguimos con el fallback */ }
  }
  try {
    await navigator.clipboard.writeText(link);
    showToast('Link copiado 📋');
  } catch (e) {
    prompt('Copia este link:', link);
  }
});

// ---------- Tabs ----------
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});
function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + name));
  if (name === 'balance') renderBalance();
}

// ---------- Menú de grupo ----------
document.getElementById('btn-group-menu').addEventListener('click', () => {
  document.getElementById('group-menu-title').textContent = state.currentGroup.name;
  openModal('modal-group-menu');
});

document.getElementById('btn-delete-group').addEventListener('click', async () => {
  if (!confirm('¿Eliminar este grupo para TODOS los que tienen el link?')) return;
  try {
    await db.collection('groups').doc(state.currentGroupId).delete();
  } catch (err) {
    console.error(err);
  }
  removeMyGroup(state.currentGroupId);
  closeModal('modal-group-menu');
  backToGroups();
});

// ---------- Miembros ----------
function renderMembers() {
  const g = state.currentGroup;
  const list = document.getElementById('members-list');
  list.innerHTML = '';
  (g.members || []).forEach((m) => {
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
  const g = state.currentGroup;
  const usedInExpense = (g.expenses || []).some(
    (e) => e.payerId === memberId || e.participantIds.includes(memberId)
  );
  if (usedInExpense) {
    showToast('No se puede quitar: tiene gastos asociados');
    return;
  }
  const newMembers = g.members.filter((m) => m.id !== memberId);
  updateGroup({ members: newMembers });
}

document.getElementById('form-add-member').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('input-member-name');
  const name = input.value.trim();
  if (!name) return;
  const newMembers = [...(state.currentGroup.members || []), { id: uid(), name }];
  updateGroup({ members: newMembers });
  input.value = '';
});

// ---------- Gastos ----------
document.getElementById('btn-new-expense').addEventListener('click', () => {
  const g = state.currentGroup;
  if (!g.members || g.members.length < 1) {
    showToast('Agrega al menos un miembro primero');
    return;
  }
  document.getElementById('form-new-expense').reset();

  const payerSelect = document.getElementById('select-expense-payer');
  payerSelect.innerHTML = g.members.map((m) => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('');

  const myName = getMyName(state.currentGroupId);
  const myMember = g.members.find((m) => m.name === myName);
  if (myMember) payerSelect.value = myMember.id;

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

  const newExpense = { id: uid(), desc, amount, payerId, participantIds, date: Date.now() };
  const newExpenses = [...(state.currentGroup.expenses || []), newExpense];
  updateGroup({ expenses: newExpenses });
  closeModal('modal-new-expense');
});

function renderExpenses() {
  const g = state.currentGroup;
  const list = document.getElementById('expenses-list');
  const empty = document.getElementById('expenses-empty');
  list.innerHTML = '';

  const expenses = g.expenses || [];
  if (expenses.length === 0) {
    empty.classList.add('show');
    return;
  }
  empty.classList.remove('show');

  const memberName = (id) => (g.members.find((m) => m.id === id) || {}).name || '???';

  [...expenses].reverse().forEach((exp) => {
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
        const newExpenses = state.currentGroup.expenses.filter((e) => e.id !== exp.id);
        updateGroup({ expenses: newExpenses });
      }
    });
    list.appendChild(card);
  });
}

// ---------- Balance y algoritmo de deudas ----------
function computeBalances(group) {
  const balances = {};
  (group.members || []).forEach((m) => (balances[m.id] = 0));

  (group.expenses || []).forEach((exp) => {
    const share = exp.amount / exp.participantIds.length;
    balances[exp.payerId] = (balances[exp.payerId] || 0) + exp.amount;
    exp.participantIds.forEach((pid) => {
      balances[pid] = (balances[pid] || 0) - share;
    });
  });

  return balances;
}

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

    if (amount > 0.5) settlements.push({ from: debtor.id, to: creditor.id, amount });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.5) i++;
    if (creditor.amount < 0.5) j++;
  }

  return settlements;
}

function renderBalance() {
  const g = state.currentGroup;
  const memberName = (id) => (g.members.find((m) => m.id === id) || {}).name || '???';

  const total = (g.expenses || []).reduce((s, e) => s + e.amount, 0);
  const perPerson = (g.members || []).length ? total / g.members.length : 0;

  document.getElementById('total-summary').innerHTML = `
    <div class="big">${formatMoney(total)}</div>
    <div class="label">gasto total del grupo · ${formatMoney(perPerson)} por persona si se repartiera igual</div>
  `;

  const balances = computeBalances(g);

  const perPersonDiv = document.getElementById('balance-per-person');
  perPersonDiv.innerHTML = '';
  (g.members || []).forEach((m) => {
    const bal = balances[m.id] || 0;
    const spent = (g.expenses || [])
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

// ---------- Unirse a un grupo vía link (?group=ID) ----------
async function handleIncomingLink() {
  const params = new URLSearchParams(window.location.search);
  const groupId = params.get('group');
  if (!groupId) return false;

  openModal('loading-overlay');
  let doc;
  try {
    doc = await db.collection('groups').doc(groupId).get();
  } catch (err) {
    closeModal('loading-overlay');
    showToast('No se pudo cargar el grupo. Revisa la conexión.');
    return false;
  }
  closeModal('loading-overlay');

  if (!doc.exists) {
    showToast('Ese link de grupo ya no existe');
    window.history.replaceState({}, '', window.location.pathname);
    return false;
  }

  const existingName = getMyName(groupId);
  if (existingName) {
    addMyGroup(groupId);
    openGroup(groupId);
    return true;
  }

  document.getElementById('join-group-title').textContent = `Unirte a "${doc.data().name}"`;
  openModal('modal-join-group');

  document.getElementById('form-join-group').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('input-join-name').value.trim();
    if (!name) return;

    const fresh = await db.collection('groups').doc(groupId).get();
    const data = fresh.data();
    const already = (data.members || []).find((m) => m.name.toLowerCase() === name.toLowerCase());

    if (!already) {
      const newMember = { id: uid(), name };
      await db.collection('groups').doc(groupId).update({
        members: [...(data.members || []), newMember],
      });
    }

    setMyName(groupId, name);
    addMyGroup(groupId);
    closeModal('modal-join-group');
    openGroup(groupId);
  };

  return true;
}

// ---------- Service worker ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// ---------- Init ----------
(async function init() {
  const cameFromLink = await handleIncomingLink();
  if (!cameFromLink) {
    renderGroups();
  }
})();
