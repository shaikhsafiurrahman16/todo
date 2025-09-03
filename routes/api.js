const express = require('express');
const router = express.Router();
const authRouter = require("./auth")
const crudRouter = require("./crud")

router.use("/auth", authRouter)
router.use("/crud", crudRouter)

module.exports = router;


