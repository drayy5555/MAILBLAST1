const express = require("express");
const router = express.Router();
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const db = require("../services/db");

const upload = multer({ dest: "uploads/" });

// Get leads for a campaign
router.get("/:campaignId", (req, res) => {
  const leads = db.getLeadsByCampaign(req.params.campaignId);
  res.json(leads);
});

// Add leads manually (paste)
router.post("/:campaignId", (req, res) => {
  const { leads } = req.body; // Array of { name, email }
  if (!leads || !Array.isArray(leads)) {
    return res.status(400).json({ error: "leads must be an array" });
  }
  const added = db.addLeads(req.params.campaignId, leads);
  res.json({ added: added.length, leads: added });
});

// Import leads from CSV file
router.post("/:campaignId/import", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const leads = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => {
      // Support columns: name, email OR just email
      const email = row.email || row.Email || row.EMAIL;
      const name = row.name || row.Name || row.NAME || email?.split("@")[0];
      if (email && email.includes("@")) {
        leads.push({ name, email });
      }
    })
    .on("end", () => {
      fs.unlinkSync(req.file.path); // Clean up temp file
      const added = db.addLeads(req.params.campaignId, leads);
      res.json({ added: added.length, leads: added });
    })
    .on("error", (err) => {
      res.status(500).json({ error: err.message });
    });
});

module.exports = router;
