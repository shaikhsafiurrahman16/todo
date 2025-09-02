var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt')
const execute = require("../models/database/db");


router.post("/register", async (req, res) => {
  try {
    const {full_name, email, password} = req.body;
    const hashPass = await bcrypt.hash(password, 2);
    await execute(
      "INSERT INTO user (full_name, email, password) VALUES (?, ?, ?)", 
      [	full_name, email, hashPass]
    );

    res.json({ message: "User registered!" });
  } catch (err) {
    console.error("Error:", err.message);
    res.json({ error: "Internal Server Error" });
  }
});



module.exports = router;
