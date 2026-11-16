/* ============================================================
   KVARTIRA BOSHqARUV — APP.JS (TO'LIQ)
   ============================================================ */

/* ------------------------------------------------------------
   0. GLOBAL HOLAT
   ------------------------------------------------------------ */
let rooms = [];
let tenants = [];
let payments = [];
let expenses = [];
let auditLogs = [];

let currentRoomId = null;
let currentTab = 'home';
let confirmCallback = null;

/* Rasm sozlamalari */
const PHOTO_TYPES = {
  profile: {
    file: 'profile.jpg',
    column: 'profile_photo_url',
    maxSize: 600,
    quality: 0.80,
    label: 'Profil rasmi'
  },
  passport_front: {
    file: 'passport-front.jpg',
    column: 'passport_front_url',
    maxSize: 1600,
    quality: 0.85,
    label: 'Pasport (old)'
  },
  passport_back: {
    file: 'passport-back.jpg',
    column: 'passport_back_url',
    maxSize: 1600,
    quality: 0.85,
    label: 'Pasport (orqa)'
  }
};

/* ------------------------------------------------------------
   1. TOAST
   ------------------------------------------------------------ */
function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity .3s';
    setTimeout(() => el.remove(), 300);
  }, 3200);
}
window.toast = toast;

/* ------------------------------------------------------------
   2. TASDIQLASH (CONFIRM) MODAL
   ------------------------------------------------------------ */
function showConfirm(title, message, onOk, okText = 'Ha', danger = true) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  const okBtn = document.getElementById('confirm-ok-btn');
  okBtn.textContent = okText;
  okBtn.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');
  confirmCallback = onOk;
  openModal('confirm-modal');
}

function confirmOk() {
  const cb = confirmCallback;
  confirmCallback = null;
  closeModal('confirm-modal');
  if (typeof cb === 'function') cb();
}

function closeConfirm() {
  confirmCallback = null;
  closeModal('confirm-modal');
}
window.showConfirm  = showConfirm;
window.confirmOk    = confirmOk;
window.closeConfirm = closeConfirm;

/* ------------------------------------------------------------
   3. MODAL YORDAMCHILARI
   ------------------------------------------------------------ */
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
}
window.openModal  = openModal;
window.closeModal = closeModal;

/* ------------------------------------------------------------
   4. YORDAMCHI FUNKSIYALAR
   ------------------------------------------------------------ */
function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttrForJs(url) {
  return String(url || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function avatarColor(name) {
  const palette = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function formatMoney(n) {
  const num = Number(n) || 0;
  return num.toLocaleString('uz-UZ').replace(/,/g, ' ') + " so'm";
}

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('uz-UZ');
}

function formatDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function statusBadge(status) {
  const map = {
    paid:    ['badge-paid',    "To'langan"],
    partial: ['badge-partial', 'Qismiy'],
    unpaid:  ['badge-unpaid',  "To'lanmagan"]
  };
  const [cls, label] = map[status] || map.unpaid;
  return `<span class="badge ${cls}">${label}</span>`;
}

/* Kunlar farqi: due_date -> bugun. Musbat = o'tgan, manfiy = qoldi */
function daysFromDue(dueDate) {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const now = new Date();
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.round((now - due) / 86400000);
}

/* ------------------------------------------------------------
   5. TUN / KUNDUZ REJIMI
   ------------------------------------------------------------ */
function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') document.body.classList.add('dark');
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
    btn.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const isDark = document.body.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      btn.textContent = isDark ? '☀️' : '🌙';
    });
  }
}

/* ------------------------------------------------------------
   6. EKRAN ALMASHTIRISH
   ------------------------------------------------------------ */
function switchTab(screen) {
  if (screen === 'room') {
    document.getElementById('screen-room').classList.add('active');
    document.querySelectorAll('.screen:not(#screen-room)').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-back').style.display = 'flex';
    document.getElementById('theme-toggle').style.display = 'none';
    return;
  }

  currentTab = screen;
  currentRoomId = null;

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + screen).classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.screen === screen);
  });

  document.getElementById('btn-back').style.display = 'none';
  document.getElementById('theme-toggle').style.display = 'flex';

  const titles = {
    home: '🏠 Kvartiralar',
    expenses: '💸 Xarajatlar',
    audit: '📜 Tarix',
    report: '📊 Hisobot'
  };
  document.getElementById('app-title').textContent = titles[screen] || '';

  if (screen === 'expenses') { renderExpenses(); fillExpenseRoomFilter(); }
  if (screen === 'audit')    { loadAudit(); }
  if (screen === 'report')   { renderReport(); }
  if (screen === 'home')     { renderHome(); }
}
window.switchTab = switchTab;

function goBack() {
  currentRoomId = null;
  switchTab('home');
}
window.goBack = goBack;

/* ------------------------------------------------------------
   7. MA'LUMOTLARNI YUKLASH
   ------------------------------------------------------------ */
async function loadAll() {
  try {
    const [r, t, p, e] = await Promise.all([
      dbGetRooms(),
      dbGetTenants(),
      dbGetPayments(),
      dbGetExpenses()
    ]);
    rooms = r;
    tenants = t;
    payments = p;
    expenses = e;
    renderHome();
  } catch (err) {
    console.error('Yuklash xatosi:', err);
    toast("Ma'lumotlarni yuklab bo'lmadi: " + (err.message || err), 'error');
  }
}

/* Brauzerda 90 kunlik tozalash (zaxira) */
async function runBrowserCleanup() {
  try {
    const n = await dbCleanupArchivedTenants();
    if (n > 0) console.log(`[cleanup] ${n} ta arxivlangan ijarachi o'chirildi`);
  } catch (err) {
    console.warn('Cleanup xatosi:', err);
  }
}

/* ------------------------------------------------------------
   8. BOSH SAHIFA
   ------------------------------------------------------------ */
function renderHome() {
  /* Statistika */
  const activeTenants = tenants.filter(t => t.status === 'active');
  const activeRoomIds = new Set(activeTenants.map(t => t.room_id));
  const monthlyIncome = activeTenants.reduce((s, t) => s + (Number(t.monthly_rent) || 0), 0);

  /* Qarzdorlar (to'lovi o'tgan yoki qisman) */
  const debtors = activeTenants.filter(t => {
    const due = getCurrentDueDate(t);
    if (!due) return false;
    return daysFromDue(due) > 0 && !isPaidForCurrentMonth(t);
  });

  document.getElementById('stat-rooms').textContent = rooms.length;
  document.getElementById('stat-tenants').textContent = activeTenants.length;
  document.getElementById('stat-debtors').textContent = debtors.length;
  document.getElementById('stat-income').textContent =
    (monthlyIncome / 1000000).toFixed(1) + 'M';

  /* Alert box */
  const alertBox = document.getElementById('home-alert');
  const alertBody = document.getElementById('home-alert-body');

  const overdue = activeTenants.filter(t => {
    const due = getCurrentDueDate(t);
    return due && daysFromDue(due) > 0 && !isPaidForCurrentMonth(t);
  });
  const upcoming = activeTenants.filter(t => {
    const due = getCurrentDueDate(t);
    if (!due || isPaidForCurrentMonth(t)) return false;
    const d = daysFromDue(due);
    return d <= 0 && d >= -10;
  });

  if (overdue.length === 0 && upcoming.length === 0) {
    alertBox.style.display = 'none';
  } else {
    alertBox.style.display = 'block';
    let html = '';
    if (overdue.length > 0) {
      html += `<div>🔴 <strong>${overdue.length} ta</strong> ijarachi to'lov kuni o'tgan</div>`;
    }
    if (upcoming.length > 0) {
      html += `<div>🟡 <strong>${upcoming.length} ta</strong> ijarachi to'loviga 10 kun qoldi</div>`;
    }
    alertBody.innerHTML = html;
  }

  /* Kvartiralar */
  renderRoomsGrid();
}

/* Ijarachi uchun joriy oy to'lov sanasi */
function getCurrentDueDate(tenant) {
  const now = new Date();
  const day = Number(tenant.payment_day) || 5;
  const due = new Date(now.getFullYear(), now.getMonth(), Math.min(day, 28));
  return due.toISOString().slice(0, 10);
}

/* Ijarachi joriy oy uchun to'laganmi */
function isPaidForCurrentMonth(tenant) {
  const month = currentMonth();
  const p = payments.find(x =>
    String(x.tenant_id) === String(tenant.id) &&
    x.month === month
  );
  return p && p.status === 'paid';
}

/* Kvartira holati rangini aniqlash */
function getRoomStatus(room) {
  const roomTenants = tenants.filter(t =>
    String(t.room_id) === String(room.id) && t.status === 'active'
  );
  if (roomTenants.length === 0) return 'empty';

  let hasDanger = false, hasWarn = false;
  for (const t of roomTenants) {
    const due = getCurrentDueDate(t);
    if (!due) continue;
    const d = daysFromDue(due);
    if (d > 0 && !isPaidForCurrentMonth(t)) hasDanger = true;
    else if (d <= 0 && d >= -10 && !isPaidForCurrentMonth(t)) hasWarn = true;
  }
  if (hasDanger) return 'danger';
  if (hasWarn) return 'warn';
  return 'ok';
}

function renderRoomsGrid() {
  const grid = document.getElementById('rooms-grid');
  if (!grid) return;

  if (rooms.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">Hozircha kvartira yo'q. "+ Yangi kv" tugmasini bosing.</div>`;
    return;
  }

  grid.innerHTML = rooms.map(r => {
    const roomTenants = tenants.filter(t =>
      String(t.room_id) === String(r.id) && t.status === 'active'
    );
    const status = getRoomStatus(r);
    const statusLabels = {
      ok: '🟢 OK',
      warn: '🟡 Yaqin',
      danger: '🔴 Qarz',
      empty: '⚪ Bo\'sh'
    };
    return `
      <div class="room-card status-${status}" onclick="openRoom(${r.id})">
        <div class="room-card-number">${escapeHtml(r.room_number)}</div>
        <div class="room-card-meta">
          ${roomTenants.length} kishi<br>
          ${formatMoney(r.monthly_rent)}
        </div>
        <span class="room-card-status ${status}">${statusLabels[status]}</span>
      </div>
    `;
  }).join('');
}

/* ------------------------------------------------------------
   9. KVARTIRA SAHIFASI (tablar)
   ------------------------------------------------------------ */
function openRoom(roomId) {
  const room = rooms.find(r => String(r.id) === String(roomId));
  if (!room) return;
  currentRoomId = roomId;

  document.getElementById('app-title').textContent = '🚪 Kvartira ' + room.room_number;
  renderRoomContent();
  switchTab('room');
}
window.openRoom = openRoom;

function renderRoomContent() {
  const room = rooms.find(r => String(r.id) === String(currentRoomId));
  if (!room) return;

  const roomTenants = tenants.filter(t => String(t.room_id) === String(room.id));
  const activeTenants = roomTenants.filter(t => t.status === 'active');
  const leftTenants = roomTenants.filter(t => t.status === 'left');

  document.getElementById('room-content').innerHTML = `
    <div style="margin-bottom:16px">
      <div style="font-size:13px;color:var(--text-muted)">
        ${activeTenants.length} kishi • ${formatMoney(room.monthly_rent)}/oy • To'lov kuni: ${room.payment_day || 5}
      </div>
    </div>

    <div class="tabs">
      <button class="tab-btn active" onclick="switchRoomTab('main', this)">📋 Asosiy</button>
      <button class="tab-btn" onclick="switchRoomTab('tenants', this)">👥 Ijarachilar (${activeTenants.length})</button>
    </div>

    <div class="tab-content active" id="room-tab-main">
      ${renderRoomMainTab(room, activeTenants)}
    </div>

    <div class="tab-content" id="room-tab-tenants">
      ${renderRoomTenantsTab(room, activeTenants, leftTenants)}
    </div>
  `;
}

function switchRoomTab(tab, btn) {
  document.querySelectorAll('#room-content .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#room-content .tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('room-tab-' + tab).classList.add('active');
}
window.switchRoomTab = switchRoomTab;

function renderRoomMainTab(room, activeTenants) {
  const overdue = [];
  const upcoming = [];
  const okList = [];

  for (const t of activeTenants) {
    const due = getCurrentDueDate(t);
    if (!due) { okList.push(t); continue; }
    const d = daysFromDue(due);
    const paid = isPaidForCurrentMonth(t);

    if (paid) { okList.push(t); continue; }
    if (d > 0) overdue.push({ t, d, due });
    else if (d >= -10) upcoming.push({ t, d, due });
    else okList.push(t);
  }

  let html = '';

  if (overdue.length === 0 && upcoming.length === 0) {
    html += `<div class="empty-state">✅ Barcha to'lovlar joyida. Qarzdor yo'q.</div>`;
  }

  if (overdue.length > 0) {
    html += `<div class="payment-section">
      <div class="payment-section-title">🔴 To'lov kuni o'tgan</div>`;
    for (const item of overdue) {
      const t = item.t;
      const debt = getTenantDebt(t);
      html += `
        <div class="payment-card danger">
          <div class="payment-card-header">
            ${renderAvatar(t)}
            <div class="payment-card-info">
              <div class="payment-card-name">${escapeHtml(t.full_name)}</div>
              <div class="payment-card-room">Karavot ${escapeHtml(t.bed_number || '—')}</div>
            </div>
          </div>
          <div class="payment-card-meta danger">
            <span class="label">Muddat: ${formatDate(item.due)}</span>
            <span class="value">${item.d} kun o'tgan</span>
          </div>
          <div class="payment-card-meta danger">
            <span class="label">Qarz</span>
            <span class="value">${formatMoney(debt)}</span>
          </div>
          <div class="payment-card-actions">
            ${t.phone ? `<a href="tel:${escapeHtml(t.phone)}" class="btn btn-secondary btn-sm">📞 Qo'ng'iroq</a>` : ''}
            <button class="btn btn-success btn-sm" onclick="quickPay(${t.id})">✅ To'landi</button>
            <button class="btn btn-secondary btn-sm" onclick="openTenantCard(${t.id})">→</button>
          </div>
        </div>`;
    }
    html += `</div>`;
  }

  if (upcoming.length > 0) {
    html += `<div class="payment-section">
      <div class="payment-section-title">🟡 To'lov kuni yaqinlashmoqda</div>`;
    for (const item of upcoming) {
      const t = item.t;
      html += `
        <div class="payment-card warn">
          <div class="payment-card-header">
            ${renderAvatar(t)}
            <div class="payment-card-info">
              <div class="payment-card-name">${escapeHtml(t.full_name)}</div>
              <div class="payment-card-room">Karavot ${escapeHtml(t.bed_number || '—')}</div>
            </div>
          </div>
          <div class="payment-card-meta warn">
            <span class="label">Muddat: ${formatDate(item.due)}</span>
            <span class="value">${-item.d} kun qoldi</span>
          </div>
          <div class="payment-card-meta">
            <span class="label">To'lov</span>
            <span class="value">${formatMoney(t.monthly_rent)}</span>
          </div>
          <div class="payment-card-actions">
            <button class="btn btn-success btn-sm" onclick="quickPay(${t.id})">✅ To'landi</button>
            <button class="btn btn-secondary btn-sm" onclick="openTenantCard(${t.id})">→</button>
          </div>
        </div>`;
    }
    html += `</div>`;
  }

  if (okList.length > 0 && (overdue.length > 0 || upcoming.length > 0)) {
    html += `<div class="payment-section">
      <div class="payment-section-title">🟢 To'lov qilingan / uzoq</div>`;
    for (const t of okList) {
      const due = getCurrentDueDate(t);
      const d = due ? daysFromDue(due) : 0;
      html += `
        <div class="payment-card ok">
          <div class="payment-card-header">
            ${renderAvatar(t)}
            <div class="payment-card-info">
              <div class="payment-card-name">${escapeHtml(t.full_name)}</div>
              <div class="payment-card-room">Karavot ${escapeHtml(t.bed_number || '—')}</div>
            </div>
          </div>
          <div class="payment-card-meta ok">
            <span class="label">Muddat: ${formatDate(due)}</span>
            <span class="value">${isPaidForCurrentMonth(t) ? '✅ To\'langan' : (-d) + ' kun qoldi'}</span>
          </div>
          <div class="payment-card-actions">
            <button class="btn btn-secondary btn-sm" onclick="openTenantCard(${t.id})">Batafsil</button>
          </div>
        </div>`;
    }
    html += `</div>`;
  }

  return html;
}

function renderRoomTenantsTab(room, activeTenants, leftTenants) {
  let html = `
    <button class="btn btn-primary btn-block" style="margin-bottom:12px"
            onclick="openTenantForm(${room.id})">+ Yangi ijarachi qo'shish</button>
  `;

  if (activeTenants.length === 0) {
    html += `<div class="empty-state">Hozircha faol ijarachi yo'q</div>`;
  } else {
    html += activeTenants.map(t => `
      <div class="tenant-list-item" onclick="openTenantCard(${t.id})">
        ${renderAvatar(t)}
        <div class="tenant-info">
          <div class="tenant-name">${escapeHtml(t.full_name)}</div>
          <div class="tenant-details">
            Karavot ${escapeHtml(t.bed_number || '—')} • ${formatMoney(t.monthly_rent)}/oy
          </div>
          <div class="tenant-details">
            Kirgan: ${formatDate(t.check_in_date)} • To'lov: ${t.payment_day || 5}
          </div>
        </div>
      </div>
    `).join('');
  }

  if (leftTenants.length > 0) {
    html += `<div style="margin-top:20px;margin-bottom:8px;font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Chiqarilganlar (arxiv)</div>`;
    html += leftTenants.map(t => {
      const daysLeft = 90 - Math.floor((Date.now() - new Date(t.left_at).getTime()) / 86400000);
      return `
        <div class="tenant-list-item" style="opacity:.7">
          ${renderAvatar(t)}
          <div class="tenant-info">
            <div class="tenant-name">${escapeHtml(t.full_name)}</div>
            <div class="tenant-details">Chiqarilgan: ${formatDate(t.left_at)}</div>
            <div class="tenant-details" style="color:var(--danger)">O'chirishga: ${Math.max(0, daysLeft)} kun</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();restoreTenant(${t.id})">Qaytarish</button>
            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteTenantConfirm(${t.id})">O'chirish</button>
          </div>
        </div>`;
    }).join('');
  }

  return html;
}

/* ------------------------------------------------------------
   10. IJARACHI QARZDORLIGI
   ------------------------------------------------------------ */
function getTenantDebt(tenant) {
  const tPayments = payments.filter(p => String(p.tenant_id) === String(tenant.id));
  let debt = 0;
  for (const p of tPayments) {
    debt += Math.max(0, (Number(p.amount) || 0) - (Number(p.paid_amount) || 0));
  }
  return debt;
}

function getTenantTotalPaid(tenant) {
  const tPayments = payments.filter(p => String(p.tenant_id) === String(tenant.id));
  return tPayments.reduce((s, p) => s + (Number(p.paid_amount) || 0), 0);
}

/* ------------------------------------------------------------
   11. AVATAR / PROFIL RASMI
   ------------------------------------------------------------ */
function renderAvatar(tenant) {
  const url = tenant.profile_photo_url;
  const name = (tenant.full_name || '?').trim();
  const letter = escapeHtml(name.charAt(0).toUpperCase());
  if (url) {
    return `<img class="avatar" src="${escapeHtml(url)}" alt=""
              onerror="this.style.display='none';this.nextElementSibling&&(this.nextElementSibling.style.display='inline-flex')">
            <span class="avatar-fallback" style="display:none;background:${avatarColor(name)}">${letter}</span>`;
  }
  return `<span class="avatar-fallback" style="background:${avatarColor(name)}">${letter}</span>`;
}

function renderProfilePhoto(tenant) {
  const url = tenant.profile_photo_url;
  const name = (tenant.full_name || '?').trim();
  const letter = escapeHtml(name.charAt(0).toUpperCase());
  if (url) {
    return `<img class="profile-photo" src="${escapeHtml(url)}" alt="Profil"
              onclick="openImageLightbox('${escapeAttrForJs(url)}')">`;
  }
  return `<div class="profile-photo-fallback" style="background:${avatarColor(name)}">${letter}</div>`;
}

/* ------------------------------------------------------------
   12. RASM YUKLASH JOYLARI
   ------------------------------------------------------------ */
function renderPhotoUploader(tenant) {
  const tid = tenant.id;

  const slot = (type, label, url, square = true) => {
    const has = !!url;
    const inputId = `photo-input-${tid}-${type}`;
    const style = square ? '' : 'aspect-ratio:auto;height:44px;border-radius:8px;';

    const clickAction = has
      ? `openImageLightbox('${escapeAttrForJs(url)}')`
      : `document.getElementById('${inputId}').click()`;

    return `
      <div class="photo-slot ${has ? 'has-image' : ''}"
           data-type="${type}"
           data-tenant="${tid}"
           style="${style}"
           onclick="${clickAction}">
        ${has
          ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(label)}">
             <button class="photo-remove-btn" title="O'chirish"
                     onclick="event.stopPropagation(); photoRemoveHandler(${tid}, '${type}', this)">&times;</button>`
          : `<div class="photo-slot-placeholder">
               <span class="plus">+</span>
               <span>${escapeHtml(label)}</span>
             </div>`}
        <div class="photo-slot-label">${escapeHtml(label)}</div>
        <input type="file"
               id="${inputId}"
               accept="image/*"
               ${type === 'profile' ? 'capture="user"' : 'capture="environment"'}
               style="display:none"
               onchange="photoFileHandler(${tid}, '${type}', this)">
      </div>`;
  };

  return `
    <div class="docs-section">
      <h4>Hujjatlar</h4>
      <div class="docs-grid">
        ${slot('passport_front', 'Pasport (old)', tenant.passport_front_url)}
        ${slot('passport_back',  'Pasport (orqa)', tenant.passport_back_url)}
      </div>
      <div style="margin-top:10px;">
        ${slot('profile', 'Profil rasmi', tenant.profile_photo_url, false)}
      </div>
    </div>
  `;
}
/* ------------------------------------------------------------
   13. RASM SIQISH (turiga qarab)
   ------------------------------------------------------------ */
function compressImage(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Fayl rasm emas'));
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Faylni o'qib bo'lmadi"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Rasmni ochib bo'lmadi"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width >= height) {
            height = Math.round(height * (maxSize / width));
            width = maxSize;
          } else {
            width = Math.round(width * (maxSize / height));
            height = maxSize;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Kichraytirish xatosi')),
          'image/jpeg',
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------
   14. RASM YUKLASH / O'CHIRISH HANDLER'LARI
   ------------------------------------------------------------ */
async function photoFileHandler(tenantId, type, inputEl) {
  const file = inputEl.files && inputEl.files[0];
  if (!file) return;

  const cfg = PHOTO_TYPES[type];
  if (!cfg) { toast("Noto'g'ri rasm turi", 'error'); return; }

  const slot = inputEl.closest('.photo-slot');
  if (slot) slot.classList.add('loading');

  try {
    const blob = await compressImage(file, cfg.maxSize, cfg.quality);
    const publicUrl = await dbUploadPhoto(tenantId, cfg.file, blob);
    const finalUrl = publicUrl + '?t=' + Date.now();

    await dbUpdateTenant(tenantId, { [cfg.column]: finalUrl });
    await dbAddAudit({
      entity_type: 'tenant',
      entity_id: tenantId,
      action: 'updated',
      description: `Rasm yuklandi: ${cfg.label}`
    });

    const t = tenants.find(x => String(x.id) === String(tenantId));
    if (t) t[cfg.column] = finalUrl;

    if (slot) {
      slot.classList.remove('loading');
      slot.classList.add('has-image');
      slot.setAttribute('onclick', `openImageLightbox('${escapeAttrForJs(finalUrl)}')`);
      const oldImg = slot.querySelector('img');
      if (oldImg) {
        oldImg.src = finalUrl;
      } else {
        const ph = slot.querySelector('.photo-slot-placeholder');
        if (ph) ph.remove();
        const img = document.createElement('img');
        img.src = finalUrl;
        img.alt = cfg.label;
        slot.insertBefore(img, slot.firstChild);
      }
      if (!slot.querySelector('.photo-remove-btn')) {
        const btn = document.createElement('button');
        btn.className = 'photo-remove-btn';
        btn.innerHTML = '&times;';
        btn.title = "O'chirish";
        btn.onclick = (ev) => {
          ev.stopPropagation();
          photoRemoveHandler(tenantId, type, btn);
        };
        slot.appendChild(btn);
      }
    }

    if (type === 'profile') {
      renderRoomContent();
      renderHome();
      if (document.getElementById('tenant-card-modal').classList.contains('open')) {
        openTenantCard(tenantId);
      }
    }

    toast('Rasm yuklandi ✅', 'success');
  } catch (err) {
    console.error('Yuklash xatosi:', err);
    if (slot) slot.classList.remove('loading');
    toast('Yuklashda xatolik: ' + (err.message || err), 'error');
  } finally {
    inputEl.value = '';
  }
}
window.photoFileHandler = photoFileHandler;

async function photoRemoveHandler(tenantId, type, btnEl) {
  const cfg = PHOTO_TYPES[type];
  if (!cfg) return;

  showConfirm(
    "Rasmni o'chirish",
    `${cfg.label}ni o'chirishni tasdiqlaysizmi?`,
    async () => {
      const slot = btnEl.closest('.photo-slot');
      if (slot) slot.classList.add('loading');
      try {
        await dbDeletePhoto(tenantId, cfg.file);
        await dbUpdateTenant(tenantId, { [cfg.column]: null });
        await dbAddAudit({
          entity_type: 'tenant',
          entity_id: tenantId,
          action: 'updated',
          description: `Rasm o'chirildi: ${cfg.label}`
        });

        const t = tenants.find(x => String(x.id) === String(tenantId));
        if (t) t[cfg.column] = null;

        if (slot) {
          slot.classList.remove('loading', 'has-image');
          slot.removeAttribute('onclick');
          const img = slot.querySelector('img');
          if (img) img.remove();
          const btn = slot.querySelector('.photo-remove-btn');
          if (btn) btn.remove();
          if (!slot.querySelector('.photo-slot-placeholder')) {
            const ph = document.createElement('div');
            ph.className = 'photo-slot-placeholder';
            ph.innerHTML = `<span class="plus">+</span><span>${escapeHtml(cfg.label)}</span>`;
            slot.appendChild(ph);
          }
        }

        if (type === 'profile') {
          renderRoomContent();
          renderHome();
          if (document.getElementById('tenant-card-modal').classList.contains('open')) {
            openTenantCard(tenantId);
          }
        }
        toast("Rasm o'chirildi", 'success');
      } catch (err) {
        console.error('Xato:', err);
        if (slot) slot.classList.remove('loading');
        toast("O'chirishda xatolik: " + (err.message || err), 'error');
      }
    }
  );
}
window.photoRemoveHandler = photoRemoveHandler;

/* ------------------------------------------------------------
   15. LIGHTBOX
   ------------------------------------------------------------ */
function openImageLightbox(url) {
  if (!url) return;
  const old = document.getElementById('photo-lightbox');
  if (old) old.remove();

  const box = document.createElement('div');
  box.id = 'photo-lightbox';
  box.className = 'lightbox';
  box.innerHTML = `
    <button class="lightbox-close" aria-label="Yopish">&times;</button>
    <img src="${url}" alt="">
  `;
  document.body.appendChild(box);
  requestAnimationFrame(() => box.classList.add('open'));

  const close = () => {
    box.classList.remove('open');
    setTimeout(() => box.remove(), 200);
  };
  box.querySelector('.lightbox-close').addEventListener('click', (e) => {
    e.stopPropagation(); close();
  });
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  document.addEventListener('keydown', function esc(ev) {
    if (ev.key === 'Escape') {
      document.removeEventListener('keydown', esc);
      close();
    }
  });
}
window.openImageLightbox = openImageLightbox;

/* ------------------------------------------------------------
   16. IJARACHI KARTOCHKASI
   ------------------------------------------------------------ */
function openTenantCard(tenantId) {
  const t = tenants.find(x => String(x.id) === String(tenantId));
  if (!t) return;

  const room = rooms.find(r => String(r.id) === String(t.room_id));
  const tPayments = payments
    .filter(p => String(p.tenant_id) === String(t.id))
    .sort((a, b) => (b.month || '').localeCompare(a.month || ''));

  const debt = getTenantDebt(t);
  const totalPaid = getTenantTotalPaid(t);
  const lastPayment = tPayments.find(p => p.paid_date);

  const body = document.getElementById('tenant-card-body');
  const footer = document.getElementById('tenant-card-footer');

  body.innerHTML = `
    <div class="profile-photo-wrap">
      ${renderProfilePhoto(t)}
      <div class="profile-name">${escapeHtml(t.full_name)}</div>
      <div class="profile-status">
        ${t.status === 'active' ? '🟢 Faol' : '⚪ Chiqarilgan'} • Kvartira ${escapeHtml(room?.room_number || '—')}
      </div>
    </div>

    <div class="tenant-info-block">
      ${t.phone ? `<div class="info-row"><span>Telefon</span><a href="tel:${escapeHtml(t.phone)}">${escapeHtml(t.phone)}</a></div>` : ''}
      ${t.room_in_flat ? `<div class="info-row"><span>Xona</span><strong>${escapeHtml(t.room_in_flat)}</strong></div>` : ''}
      ${t.bed_number ? `<div class="info-row"><span>Karavot</span><strong>${escapeHtml(t.bed_number)}</strong></div>` : ''}
      <div class="info-row"><span>Oylik to'lov</span><strong>${formatMoney(t.monthly_rent)}</strong></div>
      <div class="info-row"><span>To'lov kuni</span><strong>${t.payment_day || 5}</strong></div>
      <div class="info-row"><span>Kelgan</span><strong>${formatDate(t.check_in_date)}</strong></div>
      ${t.check_out_date ? `<div class="info-row"><span>Ketish</span><strong>${formatDate(t.check_out_date)}</strong></div>` : ''}
      ${t.notes ? `<div class="info-row"><span>Izoh</span><strong style="font-weight:400">${escapeHtml(t.notes)}</strong></div>` : ''}
    </div>

    <div class="finance-block">
      <div class="finance-title">Moliyaviy holat</div>
      <div class="finance-row">
        <span class="label">Jami to'langan</span>
        <span class="value green">${formatMoney(totalPaid)}</span>
      </div>
      <div class="finance-row">
        <span class="label">Jami qarz</span>
        <span class="value ${debt > 0 ? 'red' : 'green'}">${formatMoney(debt)}</span>
      </div>
      ${lastPayment ? `
      <div class="finance-row">
        <span class="label">Oxirgi to'lov</span>
        <span class="value">${formatDate(lastPayment.paid_date)}</span>
      </div>` : ''}
    </div>

    <div class="payments-history">
      <div class="payments-history-title">
        <span>To'lov tarixi (${tPayments.length})</span>
      </div>
      ${tPayments.length === 0
        ? '<div style="padding:12px;text-align:center;color:var(--text-muted);font-size:13px">Hozircha to\'lov yo\'q</div>'
        : tPayments.map(p => `
          <div class="payment-history-row">
            <span class="h-month">${escapeHtml(p.month || '—')}</span>
            <span class="h-amount">${formatMoney(p.amount)}</span>
            <span class="h-paid">${formatMoney(p.paid_amount)}</span>
            <span class="h-status">${statusBadge(p.status)}</span>
          </div>
        `).join('')}
    </div>

    <div style="margin-bottom:16px">
      <button class="btn btn-primary btn-block" onclick="openPaymentFormForTenant(${t.id})">+ To'lov qo'shish</button>
    </div>

    ${renderPhotoUploader(t)}
  `;

  footer.innerHTML = `
    <button class="btn btn-secondary" onclick="openTenantEditForm(${t.id})">✏️ Tahrirlash</button>
    ${t.status === 'active'
      ? `<button class="btn btn-secondary" onclick="markTenantLeft(${t.id})">🚪 Chiqarish</button>`
      : `<button class="btn btn-success" onclick="restoreTenant(${t.id})">↩️ Qaytarish</button>`}
    <button class="btn btn-danger" onclick="deleteTenantConfirm(${t.id})">🗑</button>
  `;

  openModal('tenant-card-modal');
}
window.openTenantCard = openTenantCard;

/* ------------------------------------------------------------
   17. KVARTIRA FORMASI
   ------------------------------------------------------------ */
function openRoomForm(roomId = null) {
  const form = document.getElementById('room-form');
  form.reset();
  document.getElementById('rf-id').value = '';
  document.getElementById('rf-payment_day').value = '5';

  if (roomId) {
    const r = rooms.find(x => String(x.id) === String(roomId));
    if (!r) return;
    document.getElementById('room-form-title').textContent = 'Tahrirlash';
    document.getElementById('rf-id').value = r.id;
    document.getElementById('rf-room_number').value = r.room_number || '';
    document.getElementById('rf-floor').value = r.floor || '';
    document.getElementById('rf-payment_day').value = r.payment_day || 5;
    document.getElementById('rf-monthly_rent').value = r.monthly_rent || '';
    document.getElementById('rf-notes').value = r.notes || '';
  } else {
    document.getElementById('room-form-title').textContent = 'Yangi kvartira';
  }
  openModal('room-form-modal');
}
window.openRoomForm = openRoomForm;

async function saveRoom(ev) {
  ev.preventDefault();
  const id = document.getElementById('rf-id').value;
  const data = {
    room_number: document.getElementById('rf-room_number').value.trim(),
    floor: Number(document.getElementById('rf-floor').value) || null,
    payment_day: Number(document.getElementById('rf-payment_day').value) || 5,
    monthly_rent: Number(document.getElementById('rf-monthly_rent').value) || 0,
    notes: document.getElementById('rf-notes').value.trim() || null
  };
  if (!data.room_number) { toast('Kvartira raqami shart', 'error'); return; }

  try {
    if (id) {
      await dbUpdateRoom(id, data);
      await dbAddAudit({ entity_type: 'room', entity_id: Number(id), action: 'updated', description: `Kvartira tahrirlandi: ${data.room_number}` });
      toast('Kvartira yangilandi', 'success');
    } else {
      const r = await dbAddRoom(data);
      await dbAddAudit({ entity_type: 'room', entity_id: r.id, action: 'created', description: `Kvartira qo'shildi: ${data.room_number}` });
      toast("Kvartira qo'shildi", 'success');
    }
    closeModal('room-form-modal');
    await loadAll();
  } catch (err) {
    console.error('Saqlash xatosi:', err);
    toast('Xatolik: ' + (err.message || err), 'error');
  }
}
window.saveRoom = saveRoom;

/* ------------------------------------------------------------
   18. IJARACHI FORMASI
   ------------------------------------------------------------ */
function openTenantForm(roomId) {
  document.getElementById('tenant-form').reset();
  document.getElementById('tf-id').value = '';
  document.getElementById('tf-room_id').value = roomId;
  document.getElementById('tenant-form-title').textContent = 'Yangi ijarachi';

  const room = rooms.find(r => String(r.id) === String(roomId));
  if (room) {
    document.getElementById('tf-monthly_rent').value = room.monthly_rent || '';
    document.getElementById('tf-payment_day').value = room.payment_day || 5;
  }
  document.getElementById('tf-check_in_date').value = todayISO();
  openModal('tenant-form-modal');
}
window.openTenantForm = openTenantForm;

function openTenantEditForm(tenantId) {
  const t = tenants.find(x => String(x.id) === String(tenantId));
  if (!t) return;
  closeModal('tenant-card-modal');
  document.getElementById('tenant-form-title').textContent = 'Tahrirlash';
  document.getElementById('tf-id').value = t.id;
  document.getElementById('tf-room_id').value = t.room_id;
  document.getElementById('tf-full_name').value = t.full_name || '';
  document.getElementById('tf-phone').value = t.phone || '';
  document.getElementById('tf-room_in_flat').value = t.room_in_flat || '';
  document.getElementById('tf-bed_number').value = t.bed_number || '';
  document.getElementById('tf-check_in_date').value = t.check_in_date || '';
  document.getElementById('tf-check_out_date').value = t.check_out_date || '';
  document.getElementById('tf-monthly_rent').value = t.monthly_rent || '';
  document.getElementById('tf-payment_day').value = t.payment_day || 5;
  document.getElementById('tf-notes').value = t.notes || '';
  openModal('tenant-form-modal');
}
window.openTenantEditForm = openTenantEditForm;

async function saveTenant(ev) {
  ev.preventDefault();
  const id = document.getElementById('tf-id').value;
  const data = {
    room_id: Number(document.getElementById('tf-room_id').value),
    full_name: document.getElementById('tf-full_name').value.trim(),
    phone: document.getElementById('tf-phone').value.trim() || null,
    room_in_flat: document.getElementById('tf-room_in_flat').value.trim() || null,
    bed_number: document.getElementById('tf-bed_number').value.trim() || null,
    check_in_date: document.getElementById('tf-check_in_date').value || todayISO(),
    check_out_date: document.getElementById('tf-check_out_date').value || null,
    monthly_rent: Number(document.getElementById('tf-monthly_rent').value) || 0,
    payment_day: Number(document.getElementById('tf-payment_day').value) || 5,
    notes: document.getElementById('tf-notes').value.trim() || null
  };
  if (!data.full_name) { toast('Ism shart', 'error'); return; }
  if (!data.room_id)   { toast('Kvartira tanlanmagan', 'error'); return; }

  try {
    if (id) {
      await dbUpdateTenant(id, data);
      await dbAddAudit({ entity_type: 'tenant', entity_id: Number(id), action: 'updated', description: `Ijarachi tahrirlandi: ${data.full_name}` });
      toast('Ijarachi yangilandi', 'success');
    } else {
      data.status = 'active';
      const t = await dbAddTenant(data);
      await dbAddAudit({ entity_type: 'tenant', entity_id: t.id, action: 'created', description: `Ijarachi qo'shildi: ${data.full_name}` });
      toast("Ijarachi qo'shildi", 'success');
    }
    closeModal('tenant-form-modal');
    await loadAll();
    if (currentRoomId) renderRoomContent();
  } catch (err) {
    console.error('Xato:', err);
    toast('Xatolik: ' + (err.message || err), 'error');
  }
}
window.saveTenant = saveTenant;

/* ------------------------------------------------------------
   19. IJARACHINI CHIQARISH / QAYTARISH / O'CHIRISH
   ------------------------------------------------------------ */
function markTenantLeft(tenantId) {
  const t = tenants.find(x => String(x.id) === String(tenantId));
  if (!t) return;
  showConfirm(
    "Ijarachini chiqarish",
    `${t.full_name} chiqarilsinmi? Profil 90 kun arxivda saqlanadi, keyin avtomatik o'chadi.`,
    async () => {
      try {
        await dbMarkTenantLeft(tenantId);
        await dbAddAudit({ entity_type: 'tenant', entity_id: tenantId, action: 'left', description: `Ijarachi chiqarildi: ${t.full_name}` });
        closeModal('tenant-card-modal');
        toast('Ijarachi chiqarildi (arxivga)', 'success');
        await loadAll();
        if (currentRoomId) renderRoomContent();
      } catch (err) {
        toast('Xatolik: ' + (err.message || err), 'error');
      }
    },
    'Ha, chiqarish', true
  );
}
window.markTenantLeft = markTenantLeft;

function restoreTenant(tenantId) {
  const t = tenants.find(x => String(x.id) === String(tenantId));
  if (!t) return;
  showConfirm(
    "Ijarachini qaytarish",
    `${t.full_name} qaytarilsinmi? Status yana "Faol" bo'ladi.`,
    async () => {
      try {
        await dbRestoreTenant(tenantId);
        await dbAddAudit({ entity_type: 'tenant', entity_id: tenantId, action: 'restored', description: `Ijarachi qaytarildi: ${t.full_name}` });
        closeModal('tenant-card-modal');
        toast('Ijarachi qaytarildi', 'success');
        await loadAll();
        if (currentRoomId) renderRoomContent();
      } catch (err) {
        toast('Xatolik: ' + (err.message || err), 'error');
      }
    },
    'Ha, qaytarish', false
  );
}
window.restoreTenant = restoreTenant;

function deleteTenantConfirm(tenantId) {
  const t = tenants.find(x => String(x.id) === String(tenantId));
  if (!t) return;
  showConfirm(
    "DIQQAT! O'chirish",
    `${t.full_name} va uning BARCHA ma'lumotlari (to'lovlar, rasmlar) DARHOL o'chiriladi. Bu amalni qaytarib bo'lmaydi. Davom etasizmi?`,
    async () => {
      try {
        await dbDeleteAllTenantPhotos(tenantId);
        await dbDeleteTenant(tenantId);
        await dbAddAudit({ entity_type: 'tenant', entity_id: tenantId, action: 'deleted', description: `Ijarachi o'chirildi: ${t.full_name}` });
        closeModal('tenant-card-modal');
        toast("Ijarachi o'chirildi", 'success');
        await loadAll();
        if (currentRoomId) renderRoomContent();
      } catch (err) {
        toast('Xatolik: ' + (err.message || err), 'error');
      }
    },
    'Ha, o\'chirish', true
  );
}
window.deleteTenantConfirm = deleteTenantConfirm;

/* ------------------------------------------------------------
   20. TO'LOV FORMASI
   ------------------------------------------------------------ */
function openPaymentFormForTenant(tenantId) {
  const t = tenants.find(x => String(x.id) === String(tenantId));
  if (!t) return;

  document.getElementById('payment-form').reset();
  document.getElementById('pf-id').value = '';
  document.getElementById('pf-tenant_id').value = t.id;
  document.getElementById('payment-form-title').textContent = "To'lov qo'shish";
  document.getElementById('pf-tenant-info').innerHTML =
    `<strong>${escapeHtml(t.full_name)}</strong> • Karavot ${escapeHtml(t.bed_number || '—')}`;
  document.getElementById('pf-month').value = currentMonth();
  document.getElementById('pf-amount').value = t.monthly_rent || 0;
  document.getElementById('pf-paid_amount').value = t.monthly_rent || 0;
  document.getElementById('pf-due_date').value = getCurrentDueDate(t);
  document.getElementById('pf-paid_date').value = todayISO();
  document.getElementById('pf-status').value = 'paid';
  openModal('payment-form-modal');
}
window.openPaymentFormForTenant = openPaymentFormForTenant;

function quickPay(tenantId) {
  openPaymentFormForTenant(tenantId);
}
window.quickPay = quickPay;

async function savePayment(ev) {
  ev.preventDefault();
  const id = document.getElementById('pf-id').value;
  const tenantId = Number(document.getElementById('pf-tenant_id').value);
  const data = {
    tenant_id: tenantId,
    month: document.getElementById('pf-month').value,
    amount: Number(document.getElementById('pf-amount').value) || 0,
    paid_amount: Number(document.getElementById('pf-paid_amount').value) || 0,
    due_date: document.getElementById('pf-due_date').value || null,
    paid_date: document.getElementById('pf-paid_date').value || null,
    status: document.getElementById('pf-status').value,
    notes: document.getElementById('pf-notes').value.trim() || null
  };
  if (!data.month) { toast('Oy tanlanmagan', 'error'); return; }

  try {
    if (id) {
      await dbUpdatePayment(id, data);
      await dbAddAudit({ entity_type: 'payment', entity_id: Number(id), action: 'updated', description: `To'lov tahrirlandi: ${formatMoney(data.paid_amount)} (${data.month})` });
      toast("To'lov yangilandi", 'success');
    } else {
      const p = await dbAddPayment(data);
      await dbAddAudit({ entity_type: 'payment', entity_id: p.id, action: 'created', description: `To'lov qo'shildi: ${formatMoney(data.paid_amount)} (${data.month})` });
      toast("To'lov qo'shildi", 'success');
    }
    closeModal('payment-form-modal');
    await loadAll();
    if (currentRoomId) renderRoomContent();
    if (document.getElementById('tenant-card-modal').classList.contains('open')) {
      openTenantCard(tenantId);
    }
  } catch (err) {
    console.error('Xato:', err);
    toast('Xatolik: ' + (err.message || err), 'error');
  }
}
window.savePayment = savePayment;

/* ------------------------------------------------------------
   21. XARAJATLAR
   ------------------------------------------------------------ */
function fillExpenseRoomFilter() {
  const sel = document.getElementById('exp-filter-room');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = `<option value="">Barcha kvartiralar</option>` +
    rooms.map(r => `<option value="${r.id}">Kv ${escapeHtml(r.room_number)}</option>`).join('');
  sel.value = cur;
}

function getPeriodRange(period) {
  const now = new Date();
  if (period === 'this-month') {
    return [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0)];
  }
  if (period === 'last-month') {
    return [new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 0)];
  }
  if (period === 'this-year') {
    return [new Date(now.getFullYear(), 0, 1), new Date(now.getFullYear(), 11, 31)];
  }
  return [null, null];
}

function renderExpenses() {
  const roomFilter = document.getElementById('exp-filter-room')?.value || '';
  const period = document.getElementById('exp-filter-period')?.value || 'this-month';
  const [from, to] = getPeriodRange(period);

  let list = expenses.slice();
  if (roomFilter) list = list.filter(e => String(e.room_id) === String(roomFilter));
  if (from && to) {
    list = list.filter(e => {
      const d = new Date(e.expense_date);
      return d >= from && d <= to;
    });
  }

  const total = list.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const byCat = {};
  for (const e of list) byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount);

  const catLabels = {
    remont: '🔧 Remont', kommunal: '💡 Kommunal', mebel: '🪑 Mebel',
    tozalash: '🧹 Tozalash', suv: '🚰 Suv', elektr: '⚡ Elektr',
    gaz: '🔥 Gaz', internet: '🌐 Internet', boshqa: '📦 Boshqa'
  };

  document.getElementById('exp-summary').innerHTML = `
    <div class="summary-title">Jami xarajat</div>
    <div class="summary-value">${formatMoney(total)}</div>
    <div class="summary-breakdown">
      ${Object.entries(byCat).map(([c, a]) =>
        `<div><span>${catLabels[c] || c}</span><span>${formatMoney(a)}</span></div>`
      ).join('')}
    </div>
  `;

  const listEl = document.getElementById('expenses-list');
  if (list.length === 0) {
    listEl.innerHTML = `<div class="empty-state">Xarajat yo'q</div>`;
    return;
  }

  const roomMap = Object.fromEntries(rooms.map(r => [String(r.id), r]));
  listEl.innerHTML = list.map(e => {
    const room = e.room_id ? roomMap[String(e.room_id)] : null;
    return `
      <div class="expense-item">
        <div class="expense-icon">${(catLabels[e.category] || '📦').split(' ')[0]}</div>
        <div class="expense-info">
          <div class="expense-category">${catLabels[e.category] || e.category}${room ? ' • Kv ' + escapeHtml(room.room_number) : ''}</div>
          <div class="expense-desc">${escapeHtml(e.description || '—')}</div>
          <div class="expense-date">${formatDate(e.expense_date)}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
          <div class="expense-amount">${formatMoney(e.amount)}</div>
          <div style="display:flex;gap:4px">
            <button class="btn btn-secondary btn-sm" onclick="editExpense(${e.id})">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="deleteExpenseConfirm(${e.id})">🗑</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}
window.renderExpenses = renderExpenses;

function openExpenseForm(expenseId = null) {
  document.getElementById('expense-form').reset();
  document.getElementById('ef-id').value = '';
  document.getElementById('ef-expense_date').value = todayISO();

  const roomSel = document.getElementById('ef-room_id');
  roomSel.innerHTML = `<option value="">Umumiy (barcha kvartiralar)</option>` +
    rooms.map(r => `<option value="${r.id}">Kv ${escapeHtml(r.room_number)}</option>`).join('');

  if (expenseId) {
    const e = expenses.find(x => String(x.id) === String(expenseId));
    if (!e) return;
    document.getElementById('expense-form-title').textContent = 'Tahrirlash';
    document.getElementById('ef-id').value = e.id;
    document.getElementById('ef-room_id').value = e.room_id || '';
    document.getElementById('ef-category').value = e.category || 'boshqa';
    document.getElementById('ef-amount').value = e.amount || '';
    document.getElementById('ef-expense_date').value = e.expense_date || '';
    document.getElementById('ef-description').value = e.description || '';
  } else {
    document.getElementById('expense-form-title').textContent = 'Yangi xarajat';
  }
  openModal('expense-form-modal');
}
window.openExpenseForm = openExpenseForm;

function editExpense(id) { openExpenseForm(id); }
window.editExpense = editExpense;

async function saveExpense(ev) {
  ev.preventDefault();
  const id = document.getElementById('ef-id').value;
  const data = {
    room_id: document.getElementById('ef-room_id').value ? Number(document.getElementById('ef-room_id').value) : null,
    category: document.getElementById('ef-category').value,
    amount: Number(document.getElementById('ef-amount').value) || 0,
    expense_date: document.getElementById('ef-expense_date').value || todayISO(),
    description: document.getElementById('ef-description').value.trim() || null
  };
  if (data.amount <= 0) { toast("Summa 0 dan katta bo'lishi kerak", 'error'); return; }

  try {
    if (id) {
      await dbUpdateExpense(id, data);
      await dbAddAudit({ entity_type: 'expense', entity_id: Number(id), action: 'updated', description: `Xarajat tahrirlandi: ${formatMoney(data.amount)}` });
      toast('Xarajat yangilandi', 'success');
    } else {
      const e = await dbAddExpense(data);
      await dbAddAudit({ entity_type: 'expense', entity_id: e.id, action: 'created', description: `Xarajat qo'shildi: ${formatMoney(data.amount)}` });
      toast("Xarajat qo'shildi", 'success');
    }
    closeModal('expense-form-modal');
    await loadAll();
    renderExpenses();
  } catch (err) {
    console.error('Xato:', err);
    toast('Xatolik: ' + (err.message || err), 'error');
  }
}
window.saveExpense = saveExpense;

function deleteExpenseConfirm(id) {
  showConfirm("O'chirish", "Xarajatni o'chirishni tasdiqlaysizmi?", async () => {
    try {
      await dbDeleteExpense(id);
      await dbAddAudit({ entity_type: 'expense', entity_id: id, action: 'deleted', description: "Xarajat o'chirildi" });
      toast("O'chirildi", 'success');
      await loadAll();
      renderExpenses();
    } catch (err) {
      toast('Xatolik: ' + (err.message || err), 'error');
    }
  });
}
window.deleteExpenseConfirm = deleteExpenseConfirm;

/* ------------------------------------------------------------
   22. TARIX (AUDIT)
   ------------------------------------------------------------ */
async function loadAudit() {
  try {
    auditLogs = await dbGetAudit(300);
    renderAudit();
  } catch (err) {
    console.error('Audit yuklash xatosi:', err);
    document.getElementById('audit-list').innerHTML = `<div class="empty-state">Yuklab bo'lmadi</div>`;
  }
}

function renderAudit() {
  const typeFilter = document.getElementById('audit-filter-type')?.value || '';
  const period = document.getElementById('audit-filter-period')?.value || 'this-month';
  const [from, to] = getPeriodRange(period);

  let list = auditLogs.slice();
  if (typeFilter) list = list.filter(l => l.entity_type === typeFilter);
  if (from && to) list = list.filter(l => {
    const d = new Date(l.created_at);
    return d >= from && d <= to;
  });

  const listEl = document.getElementById('audit-list');
  if (list.length === 0) {
    listEl.innerHTML = `<div class="empty-state">Tarix bo'sh</div>`;
    return;
  }

  const actionClass = {
    created: 'created', updated: 'updated', deleted: 'deleted',
    left: 'left', restored: 'created', auto_deleted: 'deleted'
  };

  listEl.innerHTML = list.map(l => {
    let cls = actionClass[l.action] || 'updated';
    if (l.entity_type === 'payment') cls = 'payment';
    if (l.entity_type === 'expense') cls = 'expense';

    return `
      <div class="audit-item ${cls}">
        <div class="audit-time">${formatDateTime(l.created_at)}</div>
        <div class="audit-desc">${escapeHtml(l.description || '—')}</div>
      </div>
    `;
  }).join('');
}
window.renderAudit = renderAudit;

/* ------------------------------------------------------------
   23. HISOBOT
   ------------------------------------------------------------ */
function renderReport() {
  const period = document.getElementById('report-period')?.value || 'this-month';
  const customDiv = document.getElementById('report-custom');
  if (period === 'custom') {
    customDiv.style.display = 'flex';
    return;
  } else {
    customDiv.style.display = 'none';
  }

  const [from, to] = getPeriodRange(period);
  computeAndRenderReport(from, to);
}

function renderCustomReport() {
  const from = document.getElementById('report-from')?.value;
  const to = document.getElementById('report-to')?.value;
  if (!from || !to) { toast('Sanani tanlang', 'error'); return; }
  computeAndRenderReport(new Date(from), new Date(to));
}
window.renderCustomReport = renderCustomReport;

function computeAndRenderReport(from, to) {
  const inRange = (d) => {
    if (!from || !to) return true;
    const dt = new Date(d);
    return dt >= from && dt <= to;
  };

  /* Daromad: to'langan to'lovlar */
  const paymentsInRange = payments.filter(p => p.paid_date && inRange(p.paid_date));
  const totalPaid = paymentsInRange.reduce((s, p) => s + (Number(p.paid_amount) || 0), 0);

  /* Kutilgan: faol ijarachilar oylik */
  const activeTenants = tenants.filter(t => t.status === 'active');
  const expected = activeTenants.reduce((s, t) => s + (Number(t.monthly_rent) || 0), 0);

  /* Qarz */
  const totalDebt = activeTenants.reduce((s, t) => s + getTenantDebt(t), 0);

  /* Xarajat */
  const expensesInRange = expenses.filter(e => inRange(e.expense_date));
  const totalExpenses = expensesInRange.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  /* Sof foyda */
  const profit = totalPaid - totalExpenses;

  /* Kategoriya bo'yicha xarajat */
  const byCat = {};
  for (const e of expensesInRange) byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount);

  const catLabels = {
    remont: '🔧 Remont', kommunal: '💡 Kommunal', mebel: '🪑 Mebel',
    tozalash: '🧹 Tozalash', suv: '🚰 Suv', elektr: '⚡ Elektr',
    gaz: '🔥 Gaz', internet: '🌐 Internet', boshqa: '📦 Boshqa'
  };

  document.getElementById('report-content').innerHTML = `
    <div class="report-grid">
      <div class="report-card">
        <div class="report-card-title">Kutilgan daromad</div>
        <div class="report-card-value blue">${formatMoney(expected)}</div>
      </div>
      <div class="report-card">
        <div class="report-card-title">To'langan</div>
        <div class="report-card-value green">${formatMoney(totalPaid)}</div>
      </div>
      <div class="report-card">
        <div class="report-card-title">Jami qarz</div>
        <div class="report-card-value red">${formatMoney(totalDebt)}</div>
      </div>
      <div class="report-card">
        <div class="report-card-title">Xarajat</div>
        <div class="report-card-value red">${formatMoney(totalExpenses)}</div>
      </div>
    </div>

    <div class="report-card" style="margin-bottom:16px">
      <div class="report-card-title">Sof foyda (to'langan − xarajat)</div>
      <div class="report-card-value ${profit >= 0 ? 'green' : 'red'}">${formatMoney(profit)}</div>
    </div>

    <div class="report-card">
      <div class="report-card-title">Xarajat taqsimoti</div>
      ${Object.keys(byCat).length === 0
        ? '<div style="color:var(--text-muted);font-size:13px">Xarajat yo\'q</div>'
        : Object.entries(byCat).map(([c, a]) => `
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
            <span>${catLabels[c] || c}</span>
            <strong>${formatMoney(a)}</strong>
          </div>
        `).join('')}
    </div>
  `;
}
window.computeAndRenderReport = computeAndRenderReport;

/* ------------------------------------------------------------
   24. ISHGA TUSHIRISH
   ------------------------------------------------------------ */
window.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await runBrowserCleanup();
  await loadAll();
});