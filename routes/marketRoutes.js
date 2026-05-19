const router = require("express").Router();

router.get("/", (req,res)=>{
  res.json([{_id:1,name:"Seeds",price:200}]);
});

module.exports = router;