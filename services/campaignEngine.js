const { sendEmail, personalizeEmail } = require("./emailService");
const db = require("./db");

// Active campaigns stored in memory
const activeCampaigns = {};

async function runCampaign(campaignId) {
  const campaign = db.getCampaign(campaignId);
  if (!campaign) return;

  const leads = db.getLeadsByCampaign(campaignId).filter(l => l.status === "pending");
  const accounts = db.getActiveAccounts();

  if (!leads.length || !accounts.length) {
    db.updateCampaign(campaignId, { status: "completed" });
    return;
  }

  activeCampaigns[campaignId] = true;
  db.updateCampaign(campaignId, { status: "running" });

  let accountIndex = 0;
  let sentOnCurrentAccount = 0;

  for (const lead of leads) {
    // Stop if campaign was paused
    if (!activeCampaigns[campaignId]) {
      db.updateCampaign(campaignId, { status: "paused" });
      return;
    }

    // Get current account
    let account = accounts[accountIndex];

    // Switch account if daily limit reached
    if (sentOnCurrentAccount >= account.daily_limit) {
      accountIndex++;
      sentOnCurrentAccount = 0;

      if (accountIndex >= accounts.length) {
        // All accounts exhausted for today
        db.addLog(campaignId, "All accounts hit daily limit. Campaign paused.", "warn");
        db.updateCampaign(campaignId, { status: "paused" });
        break;
      }

      account = accounts[accountIndex];
      db.addLog(campaignId, `Switched to account: ${account.email}`, "info");
    }

    // Personalize and send
    try {
      const body = personalizeEmail(campaign.body, lead, account.email);
      await sendEmail({ account, to: lead.email, subject: campaign.subject, body });

      // Update lead status
      db.updateLead(lead.id, { status: "sent", sent_at: new Date().toISOString() });

      // Update account sent count
      db.incrementAccountSent(account.id);
      sentOnCurrentAccount++;

      db.addLog(campaignId, `Sent to ${lead.email} via ${account.email}`, "success");
    } catch (err) {
      db.updateLead(lead.id, { status: "failed" });
      db.addLog(campaignId, `Failed to send to ${lead.email}: ${err.message}`, "error");
    }

    // Wait between sends (avoid spam detection)
    const delayMs = (campaign.delay_seconds || 30) * 1000;
    await sleep(delayMs);
  }

  // Mark campaign complete
  delete activeCampaigns[campaignId];
  db.updateCampaign(campaignId, { status: "completed" });
  db.addLog(campaignId, "Campaign completed ✓", "success");
}

function pauseCampaign(campaignId) {
  delete activeCampaigns[campaignId];
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { runCampaign, pauseCampaign };
