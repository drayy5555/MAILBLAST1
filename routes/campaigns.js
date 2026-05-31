const express = require("express");
const router = express.Router();
const db = require("../services/db");
const { runCampaign, pauseCampaign } = require("../services/campaignEngine");

// Get all campaigns
router.get("/", (req, res) => {
  res.json(db.getAllCampaigns());
});

// Create campaign
router.post("/", (req, res) => {
  const { name, subject, body, delay_seconds } = req.body;
  if (!name || !subject || !body) {
    return res.status(400).json({ error: "name, subject, and body are required" });
  }
  const campaign = db.createCampaign({ name, subject, body, delay_seconds: delay_seconds || 30 });
  res.json(campaign);
});

// Start campaign
router.post("/:id/start", async (req, res) => {
  const campaign = db.getCampaign(req.params.id);
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });

  // Run in background — don't await so response returns immediately
  runCampaign(req.params.id);
  res.json({ status: "started", campaignId: req.params.id });
});

// Pause campaign
router.post("/:id/pause", (req, res) => {
  pauseCampaign(req.params.id);
  res.json({ status: "paused", campaignId: req.params.id });
});

// Get campaign stats
router.get("/:id/stats", (req, res) => {
  const campaign = db.getCampaign(req.params.id);
  if (!campaign) return res.status(404).json({ error: "Not found" });

  const leads = db.getLeadsByCampaign(req.params.id);
  const logs = db.getLogsByCampaign(req.params.id);

  res.json({
    campaign,
    stats: {
      total: leads.length,
      sent: leads.filter(l => l.status === "sent").length,
      pending: leads.filter(l => l.status === "pending").length,
      failed: leads.filter(l => l.status === "failed").length,
    },
    logs: logs.slice(-50),
  });
});

module.exports = router;
