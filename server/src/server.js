const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const ticketRoutes = require("./routes/tickets");

const app = express();

app.use(cors());
app.use(express.json());
app.use(authRoutes);
app.use(ticketRoutes);

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`UniDesk API running on port ${port}`);
  });
}

module.exports = app;
