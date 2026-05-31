const express = require("express");
const cors = require("cors");
const campaignRoutes = require("./routes/campaigns");
const accountRoutes = require("./routes/accounts");
const leadRoutes = require("./routes/leads");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/campaigns", campaignRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/leads", leadRoutes);

// Health check
app.get("/", (req, res) => res.json({ status: "MailBlast Pro Backend Running ✅" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
