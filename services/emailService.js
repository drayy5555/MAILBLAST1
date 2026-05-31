const { google } = require("googleapis");
const nodemailer = require("nodemailer");

// Create OAuth2 client for a Gmail account
function createOAuthClient(account) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: account.refresh_token,
  });

  return oauth2Client;
}

// Send a single email via Gmail API
async function sendEmail({ account, to, subject, body }) {
  const oauth2Client = createOAuthClient(account);

  const accessToken = await oauth2Client.getAccessToken();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: account.email,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: account.refresh_token,
      accessToken: accessToken.token,
    },
  });

  const result = await transporter.sendMail({
    from: account.email,
    to,
    subject,
    text: body,
    html: body.replace(/\n/g, "<br>"),
  });

  return result;
}

// Personalize email body with lead data
function personalizeEmail(template, lead, senderName) {
  return template
    .replace(/{{name}}/g, lead.name || "there")
    .replace(/{{email}}/g, lead.email)
    .replace(/{{sender}}/g, senderName || "");
}

module.exports = { sendEmail, personalizeEmail };
