const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req,res)=>{
  const user = await User.findOne({phone:req.body.phone});
  if(!user) return res.status(400).send("No user");

  const valid = await bcrypt.compare(req.body.password,user.password);
  if(!valid) return res.status(400).send("Wrong");

  const token = jwt.sign({id:user._id},"secret");
  res.json({token});
};