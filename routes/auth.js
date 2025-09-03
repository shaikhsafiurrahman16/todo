var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
const execute = require("../models/database/db");
const { body, validationResult } = require("express-validator");

router.post(
  "/register",
  [
    body("full_name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6, max: 12 })
      .withMessage("Password must be 6-12 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return res.json({ errors: errors });

    } else {
      try {
        const { full_name, email, password } = req.body;
        const hashPass = await bcrypt.hash(password, 10);
        await execute("INSERT INTO user (full_name, email, password) VALUES (?, ?, ?)",[full_name, email, hashPass]);
        return res.json({ message: "User registered!" });
      } catch (err) {
        console.error("Error:", err.message);
        return res.json({ error: "Invalid" });
      }
    }
  }
);

router.post(
  "/login",
  [
    body("email").notEmpty().isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    } else {
      try {
        const { email, password } = req.body;

        const user = await execute("SELECT * FROM user WHERE email = ?", [
          email,
        ]);
        if (user.length === 0) {
          return res.json({ error: "User not found" });
        } else {
          const isMatch = await bcrypt.compare(password, user[0].password);
          if (!isMatch) {
            return res.json({ error: "Password is incorrect" });
          } else {
            return res.json({ message: "Login successful" });
          }
        }
      } catch (err) {
        console.error("Error:", err.message);
        res.json({ error: "Invalid" });
      }
    }
  }
);

module.exports = router;
