var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
const execute = require("../models/database/db");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const seckey = "mysecretkey";

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
        await execute(
          "INSERT INTO user (full_name, email, password) VALUES (?, ?, ?)",
          [full_name, email, hashPass]
        );
        return res.json({ status: true, message: "User registered!" });
      } catch (err) {
        console.error("Error:", err.message);
        return res.json({ status: false, error: "Invalid" });
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
      return res.json({ errors: errors });
    } else {
      try {
        const { email, password } = req.body;

        const user = await execute("SELECT * FROM user WHERE email = ?", [
          email,
        ]);
        if (user.length === 0) {
          return res.json({ status: false, message: "User not found" });
        } else {
          const isMatch = await bcrypt.compare(password, user[0].password);
          if (!isMatch) {
            return res.json({
              status: false,
              message: "Password is incorrect",
            });
          } else {
            const token = jwt.sign(
              { userId: user[0].id, email: user[0].email },
              seckey,
              { expiresIn: "1h" }
            );
            return res.json({
              status: true,
              message: "Login successful",
              token,
            });
          }
        }
      } catch (err) {
        console.error("Error:", err.message);
        res.json({ status: false, message: "Invalid" });
      }
    }
  }
);





module.exports = router;
