const express = require("express");
const router = express.Router();
const db = require("../services/db");

// Get all accounts
router.get("/", (req, res) => {
  const accounts = db.getAllAccounts();
  // Hide refresh tokens from response
  const safe = accounts.map(({ refresh_token, ...rest }) => rest);
  res.json(safe);
});

// Add a Gmail account
router.post("/", (req, res) => {
  const { email, daily_limit, refresh_token } = req.body;
  if (!email || !refresh_token) {
    return res.status(400).json({ error: "email and refresh_token are required" });
  }
  const account = db.addAccount({ email, daily_limit: daily_limit || 50, refresh_token });
  const { refresh_token: _, ...safe } = account;
  res.json(safe);
});

// Toggle account active/inactive
router.patch("/:id/toggle", (req, res) => {
  const accounts = db.getAllAccounts();
  const account = accounts.find(a => a.id === req.params.id);
  if (!account) return res.status(404).json({ error: "Account not found" });
  db.updateAccount(req.params.id, { active: !account.active });
  res.json({ success: true });
});

// Update daily limit
router.patch("/:id/limit", (req, res) => {
  const { daily_limit } = req.body;
  db.updateAccount(req.params.id, { daily_limit });
  res.json({ success: true });
});

// Reset daily sent count (run this daily via cron)
router.post("/reset-daily", (req, res) => {
  const accounts = db.getAllAccounts();
  accounts.forEach(a => db.updateAccount(a.id, { sent_today: 0 }));
  res.json({ success: true, message: "Daily counts reset" });
});

module.exports = router;
