const express = require("express");
const router = express.Router();

// Login
router.post("/login", (req, res) => {
  res.json({ message: "Login endpoint" });
});

// Register
router.post("/register", (req, res) => {
  res.json({ message: "Register endpoint" });
});

// Logout
router.post("/logout", (req, res) => {
  res.json({ message: "Logout endpoint" });
});

module.exports = router;

