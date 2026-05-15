const router = require("express").Router();

router.get("/", (req,res)=>{
  res.json([{name:"Soybean"},{name:"Maize"}]);
});

module.exports = router;