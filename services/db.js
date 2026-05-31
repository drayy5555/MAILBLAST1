const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/db.json");

function initDB() {
  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
      users: [],
      pendingUsers: [],
      tokens: [],
      resetCodes: [],
      campaigns: [],
      leads: [],
      accounts: [],
      logs: [],
    }, null, 2));
  }
}

function readDB() {
  initDB();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ── USERS ────────────────────────────────────────────────
function getUserByEmail(email) {
  return readDB().users.find(u => u.email === email) || null;
}

function getUserById(id) {
  return readDB().users.find(u => u.id === id) || null;
}

function createUser({ name, email, password }) {
  const db = readDB();
  const user = { id: Date.now().toString(), name, email, password, verified: true, createdAt: new Date().toISOString() };
  db.users.push(user);
  writeDB(db);
  return user;
}

function updateUserPassword(email, newPassword) {
  const db = readDB();
  db.users = db.users.map(u => u.email === email ? { ...u, password: newPassword } : u);
  writeDB(db);
}

// ── PENDING USERS (awaiting verification) ────────────────
function savePendingUser(data) {
  const db = readDB();
  db.pendingUsers = db.pendingUsers.filter(u => u.email !== data.email);
  db.pendingUsers.push(data);
  writeDB(db);
}

function getPendingUser(email) {
  return readDB().pendingUsers.find(u => u.email === email) || null;
}

function deletePendingUser(email) {
  const db = readDB();
  db.pendingUsers = db.pendingUsers.filter(u => u.email !== email);
  writeDB(db);
}

// ── TOKENS (sessions) ────────────────────────────────────
function saveToken(userId, token) {
  const db = readDB();
  db.tokens = db.tokens.filter(t => t.userId !== userId);
  db.tokens.push({ userId, token, createdAt: new Date().toISOString() });
  writeDB(db);
}

function getUserByToken(token) {
  const db = readDB();
  const t = db.tokens.find(t => t.token === token);
  if (!t) return null;
  return getUserById(t.userId);
}

function deleteToken(token) {
  const db = readDB();
  db.tokens = db.tokens.filter(t => t.token !== token);
  writeDB(db);
}

// ── RESET CODES ──────────────────────────────────────────
function saveResetCode(email, data) {
  const db = readDB();
  db.resetCodes = db.resetCodes.filter(r => r.email !== email);
  db.resetCodes.push({ email, ...data });
  writeDB(db);
}

function getResetCode(email) {
  return readDB().resetCodes.find(r => r.email === email) || null;
}

function deleteResetCode(email) {
  const db = readDB();
  db.resetCodes = db.resetCodes.filter(r => r.email !== email);
  writeDB(db);
}

// ── CAMPAIGNS ────────────────────────────────────────────
function getCampaign(id) {
  return readDB().campaigns.find(c => c.id === id) || null;
}

function getAllCampaigns(userId) {
  return readDB().campaigns.filter(c => c.userId === userId);
}

function createCampaign(campaign) {
  const db = readDB();
  const newCampaign = { id: Date.now().toString(), createdAt: new Date().toISOString(), status: "idle", ...campaign };
  db.campaigns.push(newCampaign);
  writeDB(db);
  return newCampaign;
}

function updateCampaign(id, updates) {
  const db = readDB();
  db.campaigns = db.campaigns.map(c => c.id === id ? { ...c, ...updates } : c);
  writeDB(db);
}

// ── LEADS ────────────────────────────────────────────────
function getLeadsByCampaign(campaignId) {
  return readDB().leads.filter(l => l.campaignId === campaignId);
}

function addLeads(campaignId, leads) {
  const db = readDB();
  const newLeads = leads.map((l, i) => ({ id: `${Date.now()}_${i}`, campaignId, status: "pending", ...l }));
  db.leads.push(...newLeads);
  writeDB(db);
  return newLeads;
}

function updateLead(id, updates) {
  const db = readDB();
  db.leads = db.leads.map(l => l.id === id ? { ...l, ...updates } : l);
  writeDB(db);
}

// ── ACCOUNTS ─────────────────────────────────────────────
function getActiveAccounts(userId) {
  return readDB().accounts.filter(a => a.userId === userId && a.active);
}

function getAllAccounts(userId) {
  return readDB().accounts.filter(a => a.userId === userId);
}

function addAccount(account) {
  const db = readDB();
  const newAccount = { id: Date.now().toString(), sent_today: 0, active: true, ...account };
  db.accounts.push(newAccount);
  writeDB(db);
  return newAccount;
}

function updateAccount(id, updates) {
  const db = readDB();
  db.accounts = db.accounts.map(a => a.id === id ? { ...a, ...updates } : a);
  writeDB(db);
}

function incrementAccountSent(id) {
  const db = readDB();
  db.accounts = db.accounts.map(a => a.id === id ? { ...a, sent_today: (a.sent_today || 0) + 1 } : a);
  writeDB(db);
}

// ── LOGS ─────────────────────────────────────────────────
function addLog(campaignId, msg, type = "info") {
  const db = readDB();
  db.logs.push({ campaignId, msg, type, time: new Date().toISOString() });
  writeDB(db);
}

function getLogsByCampaign(campaignId) {
  return readDB().logs.filter(l => l.campaignId === campaignId);
}

module.exports = {
  getUserByEmail, getUserById, createUser, updateUserPassword,
  savePendingUser, getPendingUser, deletePendingUser,
  saveToken, getUserByToken, deleteToken,
  saveResetCode, getResetCode, deleteResetCode,
  getCampaign, getAllCampaigns, createCampaign, updateCampaign,
  getLeadsByCampaign, addLeads, updateLead,
  getActiveAccounts, getAllAccounts, addAccount, updateAccount, incrementAccountSent,
  addLog, getLogsByCampaign,
};
