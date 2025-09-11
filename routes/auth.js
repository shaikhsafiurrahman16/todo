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
    body("full_name")
      .notEmpty()
      .withMessage("Full name is required")
      .isString()
      .bail()
      .matches(/^[A-Za-z]{3}[A-Za-z0-9\s]*$/)
      .withMessage("Full name is invalid"),
    body("email")
      .isEmail()
      .withMessage("Valid email is required")
      .bail()
      .matches(/^[A-Za-z][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
      .withMessage("Email format is invalid"),
    body("password")
      .isLength({ min: 6, max: 12 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage("Password must contain at least one special character"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMsg = errors.array()[0].msg;
      return res.json({ status: false, message: errorMsg });
    } else {
      try {
        const { full_name, email, password } = req.body;
        const existUser = await execute("SELECT * FROM user WHERE email = ?", [
          email,
        ]);
        if (existUser.length > 0) {
          return res.json({ status: false, message: "User already exist" });
        } else {
          const hashPass = await bcrypt.hash(password, 10);
          await execute(
            "INSERT INTO user (full_name, email, password) VALUES (?, ?, ?)",
            [full_name, email, hashPass]
          );
          return res.json({
            status: true,
            message: "User registered Successfully",
          });
        }
      } catch (err) {
        console.error("Error:", err.message);
        return res.json({ status: false, message: "Something went wrong" });
      }
    }
  }
);

router.post(
  "/login",
  [
    body("email")
      // .isEmail()
      .notEmpty().withMessage("email is required")
      .matches(/^[A-Za-z][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
      .withMessage("Invalid Email"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors)
      const errorMsg = errors.array()[0].msg;
      console.log(errorMsg)
      return res.json({ status: false, message: errorMsg });
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
              message: "Incorrect Email or Password",
            });
          } else {
            const { password, ...userData } = user[0];
            await execute(
              "UPDATE user SET last_login = CURRENT_TIMESTAMP WHERE Id = ?",
              [user[0].Id]
            );
            userData.token = jwt.sign(
              { userId: user[0].Id, email: user[0].email },
              seckey,
              { expiresIn: "7d" }
            );
            return res.json({
              status: true,
              message: "Login successful",
              data: userData,
            });
          }
        }
      } catch (err) {
        console.error("Error:", err.message);
        res.json({ status: false, message: "Something went wrong" });
      }
    }
  }
);

module.exports = router;
