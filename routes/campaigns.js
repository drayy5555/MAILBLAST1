const express = require("express");
const router = express.Router();

// Get all campaigns
router.get("/", (req, res) => {
  res.json({ message: "Get all campaigns" });
});

// Create campaign
router.post("/", (req, res) => {
  res.json({ message: "Campaign created" });
});

// Get campaign by ID
router.get("/:id", (req, res) => {
  res.json({ message: `Get campaign ${req.params.id}` });
});

// Update campaign
router.put("/:id", (req, res) => {
  res.json({ message: `Campaign ${req.params.id} updated` });
});

// Delete campaign
router.delete("/:id", (req, res) => {
  res.json({ message: `Campaign ${req.params.id} deleted` });
});

module.exports = router;

