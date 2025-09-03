var express = require("express");
var router = express.Router();

router.post("/create", async (req, res) => {
    res.send("create")
});



module.exports = router;
