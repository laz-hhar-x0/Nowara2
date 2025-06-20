const express = require("express");
const cors = require("cors");
const fetch = require('node-fetch');
const path = require("path");
const app = express();
app.use(express.static('public'));

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.get("/alerts", async (req, res) => {
  const dbUrl = "https://lazhar-app-default-rtdb.firebaseio.com/alerts.json";
  try {
    const response = await fetch(dbUrl);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch from Firebase" });
  }
});

app.listen(3000, () => console.log("🚀 Server running: http://localhost:3000"));










