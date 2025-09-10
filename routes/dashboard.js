var express = require("express");
var router = express.Router();
const execute = require("../models/database/db");
const authMiddleware = require("../middleware/authmiddleware");
const { body, validationResult } = require("express-validator");

router.post("/dashboard", authMiddleware, async (req, res) => {
  return  res.json({message:"Dashboard"})
});
1
module.exports = router;
