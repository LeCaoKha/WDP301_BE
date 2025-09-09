// server.js
const express = require("express");
const app = express();
const PORT = 3000;

// Route đơn giản
app.get("/", (req, res) => {
  res.send("Hello from Node.js + Express 🚀");
});

// Chạy server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
