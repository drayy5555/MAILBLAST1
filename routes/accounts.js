const express = require("express");
const router = express.Router();

// Get all accounts
router.get("/", (req, res) => {
  res.json({ message: "Get all accounts" });
});

// Create account
router.post("/", (req, res) => {
  res.json({ message: "Account created" });
});

// Get account by ID
router.get("/:id", (req, res) => {
  res.json({ message: `Get account ${req.params.id}` });
});

// Update account
router.put("/:id", (req, res) => {
  res.json({ message: `Account ${req.params.id} updated` });
});

// Delete account
router.delete("/:id", (req, res) => {
  res.json({ message: `Account ${req.params.id} deleted` });
});

module.exports = router;

