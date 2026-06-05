const express = require("express");
const router = express.Router();

router.get("/recommend", (req, res) => {
  res.json([
    { name: "Soybean", yield: "20 quintal", suitability: "High" },
    { name: "Maize", yield: "25 quintal", suitability: "Medium" }
  ]);
});

module.exports = router;