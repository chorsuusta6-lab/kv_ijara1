
/* ============================================================
   KVARTIRA BOSHqARUV — SUPABASE.JS (TO'LIQ)
   Ma'lumotlar bazasi qatlami. UI yo'q — faqat CRUD.
   ============================================================ */

/* ------------------------------------------------------------
   1. KONFIGURATSIYA — BU 2 QATORNI O'ZGARTIRING!
   ------------------------------------------------------------ */

const SUPABASE_URL = "https://rztjhfcgvbsygfospnqt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_sqwarXIZstx8IKZ2bHYsDA_ajhS-X3H";

/* ------------------------------------------------------------
   2. CLIENT YARATISH (nom to'qnashuvi yo'q — sb ishlatamiz)
   ------------------------------------------------------------ */
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.sb = sb;
window.supabaseClient = sb;

/* ------------------------------------------------------------
   3. STORAGE SOZLAMALARI
   ------------------------------------------------------------ */
const STORAGE_BUCKET = 'tenant-photos';

/* ------------------------------------------------------------
   4. ROOMS — KVARTIRALAR
   ------------------------------------------------------------ */
async function dbGetRooms() {
  const { data, error } = await sb
    .from('rooms')
    .select('*')
    .order('room_number', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function dbGetRoom(id) {
  const { data, error } = await sb
    .from('rooms')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function dbAddRoom(room) {
  const { data, error } = await sb
    .from('rooms')
    .insert([room])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function dbUpdateRoom(id, updates) {
  const { data, error } = await sb
    .from('rooms')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function dbDeleteRoom(id) {
  const { error } = await sb
    .from('rooms')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

/* ------------------------------------------------------------
   5. TENANTS — IJARACHILAR
   ------------------------------------------------------------ */
async function dbGetTenants() {
  const { data, error } = await sb
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function dbGetTenantsByRoom(roomId) {
  const { data, error } = await sb
    .from('tenants')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function dbGetTenant(id) {
  const { data, error } = await sb
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function dbAddTenant(tenant) {
  const { data, error } = await sb
    .from('tenants')
    .insert([tenant])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function dbUpdateTenant(id, updates) {
  const { data, error } = await sb
    .from('tenants')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function dbDeleteTenant(id) {
  const { error } = await sb
    .from('tenants')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

async function dbMarkTenantLeft(id) {
  const { data, error } = await sb
    .from('tenants')
    .update({ status: 'left', left_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function dbRestoreTenant(id) {
  const { data, error } = await sb
    .from('tenants')
    .update({ status: 'active', left_at: null })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function dbCleanupArchivedTenants() {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await sb
    .from('tenants')
    .select('id')
    .eq('status', 'left')
    .lt('left_at', cutoff);
  if (error) throw error;
  if (!data || data.length === 0) return 0;

  for (const t of data) {
    await dbDeleteTenant(t.id);
  }
  return data.length;
}

/* ------------------------------------------------------------
   6. PAYMENTS — TO'LOVLAR
   ------------------------------------------------------------ */
async function dbGetPayments() {
  const { data, error } = await sb
    .from('payments')
    .select('*')
    .order('month', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function dbGetPaymentsByTenant(tenantId) {
  const { data, error } = await sb
    .from('payments')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('month', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function dbGetPayment(id) {
  const { data, error } = await sb
    .from('payments')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function dbAddPayment(payment) {
  const { data, error } = await sb
    .from('payments')
    .insert([payment])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function dbUpdatePayment(id, updates) {
  const { data, error } = await sb
    .from('payments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function dbDeletePayment(id) {
  const { error } = await sb
    .from('payments')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

/* ------------------------------------------------------------
   7. EXPENSES — XARAJATLAR
   ------------------------------------------------------------ */
async function dbGetExpenses() {
  const { data, error } = await sb
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function dbGetExpense(id) {
  const { data, error } = await sb
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function dbAddExpense(expense) {
  const { data, error } = await sb
    .from('expenses')
    .insert([expense])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function dbUpdateExpense(id, updates) {
  const { data, error } = await sb
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function dbDeleteExpense(id) {
  const { error } = await sb
    .from('expenses')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

/* ------------------------------------------------------------
   8. AUDIT_LOG — TARIX
   ------------------------------------------------------------ */
async function dbAddAudit(entry) {
  const { data, error } = await sb
    .from('audit_log')
    .insert([entry])
    .select()
    .single();
  if (error) {
    console.warn('Audit yozilmadi:', error);
    return null;
  }
  return data;
}

async function dbGetAudit(limit = 200) {
  const { data, error } = await sb
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

/* ------------------------------------------------------------
   9. STORAGE — RASMLAR
   ------------------------------------------------------------ */
async function dbUploadPhoto(tenantId, fileName, blob) {
  const path = `${tenantId}/${fileName}`;
  const { error: upErr } = await sb.storage
    .from(STORAGE_BUCKET)
    .upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: true,
      cacheControl: '3600'
    });
  if (upErr) throw upErr;

  const { data: pub } = sb.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return pub.publicUrl;
}

async function dbDeletePhoto(tenantId, fileName) {
  const path = `${tenantId}/${fileName}`;
  const { error } = await sb.storage
    .from(STORAGE_BUCKET)
    .remove([path]);
  if (error && !/not found/i.test(error.message || '')) throw error;
  return true;
}

async function dbDeleteAllTenantPhotos(tenantId) {
  const files = ['profile.jpg', 'passport-front.jpg', 'passport-back.jpg'];
  const paths = files.map(f => `${tenantId}/${f}`);
  const { error } = await sb.storage
    .from(STORAGE_BUCKET)
    .remove(paths);
  if (error && !/not found/i.test(error.message || '')) {
    console.warn("Rasmlarni o'chirishda xato:", error);
  }
  return true;
}

/* ------------------------------------------------------------
   10. GLOBAL'GA CHIQARISH
   ------------------------------------------------------------ */

/* Rooms */
window.dbGetRooms     = dbGetRooms;
window.dbGetRoom      = dbGetRoom;
window.dbAddRoom      = dbAddRoom;
window.dbUpdateRoom   = dbUpdateRoom;
window.dbDeleteRoom   = dbDeleteRoom;

/* Tenants */
window.dbGetTenants             = dbGetTenants;
window.dbGetTenantsByRoom       = dbGetTenantsByRoom;
window.dbGetTenant              = dbGetTenant;
window.dbAddTenant              = dbAddTenant;
window.dbUpdateTenant           = dbUpdateTenant;
window.dbDeleteTenant           = dbDeleteTenant;
window.dbMarkTenantLeft         = dbMarkTenantLeft;
window.dbRestoreTenant          = dbRestoreTenant;
window.dbCleanupArchivedTenants = dbCleanupArchivedTenants;

/* Payments */
window.dbGetPayments         = dbGetPayments;
window.dbGetPaymentsByTenant = dbGetPaymentsByTenant;
window.dbGetPayment          = dbGetPayment;
window.dbAddPayment          = dbAddPayment;
window.dbUpdatePayment       = dbUpdatePayment;
window.dbDeletePayment       = dbDeletePayment;

/* Expenses */
window.dbGetExpenses   = dbGetExpenses;
window.dbGetExpense    = dbGetExpense;
window.dbAddExpense    = dbAddExpense;
window.dbUpdateExpense = dbUpdateExpense;
window.dbDeleteExpense = dbDeleteExpense;

/* Audit */
window.dbAddAudit = dbAddAudit;
window.dbGetAudit = dbGetAudit;

/* Storage */
window.dbUploadPhoto           = dbUploadPhoto;
window.dbDeletePhoto           = dbDeletePhoto;
window.dbDeleteAllTenantPhotos = dbDeleteAllTenantPhotos;

console.log('[supabase.js] Client tayyor');