const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const db = require("../services/db");

// ── Helpers ──────────────────────────────────────────────

function hashPassword(password) {
  return crypto.createHash("sha256").update(password + process.env.SECRET_SALT).digest("hex");
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}

function generateToken(userId) {
  const payload = `${userId}:${Date.now()}:${process.env.SECRET_SALT}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

async function sendEmail(to, subject, body) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SYSTEM_EMAIL,
      pass: process.env.SYSTEM_EMAIL_PASSWORD,
    },
  });
  await transporter.sendMail({ from: process.env.SYSTEM_EMAIL, to, subject, html: body });
}

// ── SIGN UP ──────────────────────────────────────────────
// Step 1: User enters name, email, password → get verification code
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }

  // Check if email already registered
  const existing = db.getUserByEmail(email);
  if (existing && existing.verified) {
    return res.status(400).json({ error: "An account with this email already exists" });
  }

  const code = generateCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Save pending user
  db.savePendingUser({ name, email, password: hashPassword(password), code, expiresAt });

  // Send verification email
  try {
    await sendEmail(email, "Your MailBlast Pro Verification Code", `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 40px; background: #0A0A0F; color: #E8E8F0; border-radius: 16px;">
        <h2 style="color: #00FF94; font-size: 24px;">Welcome to MailBlast Pro ⚡</h2>
        <p style="color: #E8E8F0; margin: 20px 0;">Hi ${name}, here is your verification code:</p>
        <div style="background: #12121A; border: 1px solid #1E1E2E; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 42px; font-weight: 800; color: #00FF94; letter-spacing: 8px;">${code}</span>
        </div>
        <p style="color: #4A4A6A; font-size: 13px;">This code expires in 10 minutes. If you didn't sign up, ignore this email.</p>
      </div>
    `);
    res.json({ success: true, message: "Verification code sent to your email" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send email. Check your system email config." });
  }
});

// ── VERIFY CODE ──────────────────────────────────────────
// Step 2: User enters the 6-digit code
router.post("/verify", (req, res) => {
  const { email, code } = req.body;
  const pending = db.getPendingUser(email);

  if (!pending) return res.status(400).json({ error: "No signup found for this email" });
  if (Date.now() > pending.expiresAt) return res.status(400).json({ error: "Code has expired. Please sign up again." });
  if (pending.code !== code) return res.status(400).json({ error: "Incorrect code. Please try again." });

  // Create real user account
  const user = db.createUser({ name: pending.name, email: pending.email, password: pending.password });
  db.deletePendingUser(email);

  const token = generateToken(user.id);
  db.saveToken(user.id, token);

  res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });
});

// ── LOGIN ────────────────────────────────────────────────
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const user = db.getUserByEmail(email);
  if (!user) return res.status(401).json({ error: "No account found with this email" });
  if (!user.verified) return res.status(401).json({ error: "Account not verified yet" });

  if (user.password !== hashPassword(password)) {
    return res.status(401).json({ error: "Incorrect password. Please try again." });
  }

  const token = generateToken(user.id);
  db.saveToken(user.id, token);

  res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });
});

// ── FORGOT PASSWORD ──────────────────────────────────────
// Step 1: User enters email → get reset code
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = db.getUserByEmail(email);

  // Always return success (don't reveal if email exists)
  if (!user) return res.json({ success: true, message: "If this email exists, a reset code was sent" });

  const code = generateCode();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  db.saveResetCode(email, { code, expiresAt });

  try {
    await sendEmail(email, "Reset Your MailBlast Pro Password", `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 40px; background: #0A0A0F; color: #E8E8F0; border-radius: 16px;">
        <h2 style="color: #00FF94;">Password Reset ⚡</h2>
        <p style="color: #E8E8F0; margin: 20px 0;">Here is your password reset code:</p>
        <div style="background: #12121A; border: 1px solid #1E1E2E; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 42px; font-weight: 800; color: #FF4466; letter-spacing: 8px;">${code}</span>
        </div>
        <p style="color: #4A4A6A; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `);
  } catch (err) {
    console.error("Reset email failed:", err.message);
  }

  res.json({ success: true, message: "If this email exists, a reset code was sent" });
});

// ── RESET PASSWORD ───────────────────────────────────────
// Step 2: User enters code + new password
router.post("/reset-password", (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: "Email, code and new password are required" });
  }

  const resetData = db.getResetCode(email);
  if (!resetData) return res.status(400).json({ error: "No reset request found for this email" });
  if (Date.now() > resetData.expiresAt) return res.status(400).json({ error: "Code has expired. Please request a new one." });
  if (resetData.code !== code) return res.status(400).json({ error: "Incorrect code. Please try again." });

  db.updateUserPassword(email, hashPassword(newPassword));
  db.deleteResetCode(email);

  res.json({ success: true, message: "Password reset successfully. You can now log in." });
});

// ── VERIFY TOKEN (check if still logged in) ──────────────
router.post("/verify-token", (req, res) => {
  const { token } = req.body;
  const user = db.getUserByToken(token);
  if (!user) return res.status(401).json({ error: "Invalid or expired session" });
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
});

// ── LOGOUT ───────────────────────────────────────────────
router.post("/logout", (req, res) => {
  const { token } = req.body;
  db.deleteToken(token);
  res.json({ success: true });
});

module.exports = router;
