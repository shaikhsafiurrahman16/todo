const express = require('express');
const router = express.Router();
const authRouter = require("./auth")
const crudRouter = require("./crud")
const dashRouter = require("./dashboard")

router.use("/auth", authRouter)
router.use("/crud", crudRouter)
router.use("/dashboard", dashRouter)

module.exports = router;


