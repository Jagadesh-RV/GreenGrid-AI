const router = require("express").Router();
const Field = require("../models/Field");

// GET fields
router.get("/", async (req, res) => {
  const fields = await Field.find();
  res.json(fields);
});

// UPDATE field
router.put("/:id", async (req, res) => {
  const updated = await Field.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
});

module.exports = router;