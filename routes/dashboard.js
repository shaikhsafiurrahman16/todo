var express = require("express");
var router = express.Router();
const execute = require("../models/database/db");
const authMiddleware = require("../middleware/authmiddleware");
const { body, validationResult } = require("express-validator");

router.get("/getTodo", authMiddleware, async (req, res) => {
  try {
    const rows = await execute(
      "SELECT COUNT(*) AS total FROM second WHERE user_id = ?",
      [req.user.userId]
    );
    res.json({
      status: true,
      message: "All todos fetched",
      data: rows[0].total,
    });
  } catch (error) {
    res.json({
      status: false,
      message: "Invalid",
    });
  }
});

router.get("/completedTodo", authMiddleware, async (req, res) => {
  try {
    const rows = await execute(
      "SELECT COUNT(*) AS total FROM second WHERE user_id = ? AND Is_complete = 1",
      [req.user.userId]
    );

    res.json({
      status: true,
      message: "All todos fetched",
      data: rows[0].total,
    });
  } catch (error) {
    res.json({
      status: false,
      message: "Invalid",
    });
  }
});

router.get("/pendingTodo", authMiddleware, async (req, res) => {
  try {
    const rows = await execute(
      "SELECT COUNT(*) AS total FROM second WHERE user_id = ? AND Is_complete = 0",
      [req.user.userId]
    );

    res.json({
      status: true,
      message: "All todos fetched",
      data: rows[0].total,
    });
  } catch (error) {
    res.json({
      status: false,
      message: "Invalid",
    });
  }
});

router.post(
  "/priorityTodo",
  authMiddleware,
  [
    body("priorty")
      .notEmpty()
      .withMessage("priority is required")
      .bail()
      .isIn(["high", "medium", "low"])
      .withMessage("Select one of these high , low , medium"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        status: false,
        messege: errors.array()[0].msg,
      });
    }
    try {
      const { priorty } = req.body;

      const rows = await execute(
        "SELECT COUNT(*) AS total FROM second WHERE user_id = ? AND priorty = ?",
        [req.user.userId, priorty]
      );

      res.json({
        status: true,
        message: `${priorty} priority todos fetched`,
        data: rows[0].total,
      });
    } catch (error) {
      res.json({
        status: false,
        message: "Invalid",
      });
    }
  }
);

router.post("/UpcomingTodos", authMiddleware, async (req, res) => {
  try {
    const rows = await execute(
      "SELECT * FROM second WHERE user_id = ? AND duedate > NOW() ORDER BY duedate ASC LIMIT 10",
      [req.user.userId]
    );
    if (rows.length === 0) {
      return res.json({ status: false, message: "No upcoming todos found" });
    } else {
      res.json({
        status: true,
        message: "Upcoming todos fetched",
        data: rows,
      });
    }
  } catch (err) {
    console.error(err);
    res.json({ status: false, message: "Something went wrong" });
  }
});
module.exports = router;
