const express = require("express");
const cors = require("cors");
const { getCorsOptions } = require("./config/cors");

const app = express();

app.use(cors(getCorsOptions()));
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "tourist-safety-backend" });
});

module.exports = app;
