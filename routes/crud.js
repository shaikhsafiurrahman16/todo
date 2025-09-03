var express = require("express");
var router = express.Router();
const execute = require("../models/database/db");
const { body, validationResult } = require("express-validator");

router.post(
  "/create",
  [
    body("title").notEmpty().withMessage("Title is required").isString(),
    body("duedate").notEmpty().withMessage("date is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return res.json({ errors: errors });
    } else {
      const { title, description, duedate, color, priorty } = req.body;
      console.log(req.body);
      try {
        await execute(
          "INSERT INTO second (title, description, duedate, color, priorty) VALUES (?, ?, ?, ?, ?)",
          [title, description, duedate, color, priorty]
        );
        res.json({ status: true, message: "Todo inserted" });
      } catch (err) {
        console.error(err);
        res.json({
          status: false,
          message: "Insert failed",
          error: err.message,
        });
      }
    }
  }
);
router.post("/read", async (req, res) => {
  try {
    const rows = await execute("SELECT * FROM second", []);
    res.json({ status: true, message: "data fetched", data: rows });
  } catch (err) {
    console.error(err);
    res.json({
      status: false,
      message: "data not fetched",
      error: err.message,
    });
  }
});
router.delete("/delete", async (req, res) => {
  const { id } = req.body;

  try {
    const result = await execute("DELETE FROM second WHERE id = ?", [id]);

    if (result.affectedRows > 0) {
      res.json({
        status: true,
        message: `Id ${id} deleted successfully`,
      });
    } else {
      res.json({
        status: false,
        message: `Id ${id} not found`,
      });
    }
  } catch (err) {
    console.error(err);
    res.json({status: false,message: "Invalid",error: err.message,});
  }
});

module.exports = router;
