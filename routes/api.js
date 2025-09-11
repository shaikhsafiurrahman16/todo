const express = require('express');
const router = express.Router();
const authRouter = require("./auth")
const todoRouter = require("./todo")
const dashRouter = require("./dashboard")

router.use("/auth", authRouter)
router.use("/todo", todoRouter)
router.use("/dashboard", dashRouter)

module.exports = router;


