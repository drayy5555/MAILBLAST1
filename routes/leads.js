const express = require("express");
const router = express.Router();

// Get all leads
router.get("/", (req, res) => {
  res.json({ message: "Get all leads" });
});

// Create lead
router.post("/", (req, res) => {
  res.json({ message: "Lead created" });
});

// Get lead by ID
router.get("/:id", (req, res) => {
  res.json({ message: `Get lead ${req.params.id}` });
});

// Update lead
router.put("/:id", (req, res) => {
  res.json({ message: `Lead ${req.params.id} updated` });
});

// Delete lead
router.delete("/:id", (req, res) => {
  res.json({ message: `Lead ${req.params.id} deleted` });
});

module.exports = router;

