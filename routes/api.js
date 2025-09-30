const express = require('express');
const router = express.Router();
const authRouter = require("./auth")
const todoRouter = require("./todo")
const dashRouter = require("./dashboard")
const userRouter = require("./user")

router.use("/auth", authRouter)
router.use("/todo", todoRouter)
router.use("/dashboard", dashRouter)
router.use("/user", userRouter)

module.exports = router;


