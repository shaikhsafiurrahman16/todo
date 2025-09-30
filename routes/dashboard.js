var express = require("express");
var router = express.Router();
const execute = require("../models/database/db");
const authMiddleware = require("../middleware/authmiddleware");
const { body, validationResult } = require("express-validator");
const { Children } = require("react");


router.get("/getTodo", authMiddleware, async (req, res) => {
  try {
    const rows = await execute(
      "SELECT COUNT(*) AS total FROM todos WHERE user_id = ?",
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
      "SELECT COUNT(*) AS total FROM todos WHERE user_id = ? AND Is_complete = 1",
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
      message: "Something went wrong",
    });
  }
});

router.get("/pendingTodo", authMiddleware, async (req, res) => {
  try {
    const rows = await execute(
      "SELECT COUNT(*) AS total FROM todos WHERE status = 1 AND user_id = ? AND Is_complete = 0",
      [req.user.userId]
    );

    res.json({
      status: true,
      message: "All pending todos fetched",
      data: rows[0].total,
    });
  } catch (error) {
    res.json({
      status: false,
      message: "Something went wrong",
    });
  }
});

router.post("/UpcomingTodos", authMiddleware, async (req, res) => {
  try {
    const rows = await execute(
      "SELECT * FROM todos WHERE user_id = ? AND duedate > NOW() ORDER BY duedate ASC LIMIT 10",
      [req.user.userId]
    );
    if (rows.length === 0) {
      return res.json({ status: false, message: "No upcoming todos found" });
    } else {
      return res.json({
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
      const errormsg = errors.array()[0].msg;
      return res.json({
        status: false,
        message: errormsg,
      });
    } else {
      try {
        const { priorty } = req.body;

        const rows = await execute(
          "SELECT COUNT(*) AS total FROM todos WHERE user_id = ? AND priorty = ?",
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
          message: "Something went wrong",
        });
      }
    }
  }
);

router.post("/report", authMiddleware, async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const todos = await execute(
      `SELECT * FROM todos WHERE status = 1 AND user_id = ? AND YEAR(duedate) = ?`,
      [req.user.userId, year]
    );
    const monthlyCounts = {
      January: 0,
      February: 0,
      March: 0,
      April: 0,
      May: 0,
      June: 0,
      July: 0,
      August: 0,
      September: 0,
      October: 0,
      November: 0,
      December: 0,
    };

    todos.forEach((todo) => {
      const date = new Date(todo.duedate);
      const monthName = Object.keys(monthlyCounts)[date.getMonth()];
      monthlyCounts[monthName] += 1;
    });
    res.json({
      status: true,
      message: "Monthwise todos fetched",
      data: monthlyCounts,
    });
  } catch (error) {
    console.error(error);
    res.json({ status: false, message: "Something went wrong" });
  }
});

router.post(
  "/userread",
  authMiddleware,
  [
    body("page")
      .optional({ checkFalsy: true })
      .isInt({ min: 1 })
      .withMessage("please enter a correct page number"),
    body("limit")
      .optional({ checkFalsy: true })
      .isInt({ min: 1 })
      .withMessage("please enter a correct limit"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errormsg = errors.array()[0].msg;
      return res.json({
        status: false,
        message: errormsg,
      });
    } else {
      try {
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.body.full_name || null;

        let totalRows, rows;

        if (search) {
          totalRows = await execute(
            "SELECT COUNT(*) AS total FROM user WHERE full_name = ?",
            [search]
          );
          rows = await execute(
            "SELECT * FROM user WHERE full_name = ? LIMIT ? OFFSET ?",
            [ search, limit, offset]
          );
          if (rows.length === 0) {
            return res.json({
              status: false,
              message: "User not found",
            });
          } else {
            return res.json({
              status: true,
              message: "User fetched",
              currentPage: page,
              totalUsers: totalRows[0].total,
              data: rows,
            });
          }
        } else {
          totalRows = await execute(
            "SELECT COUNT(*) AS total FROM user",
            []
          );
          rows = await execute(
            "SELECT * FROM user LIMIT ? OFFSET ?",
            [ limit, offset]
          );
        }
        const totalUsers = totalRows[0].total;
        res.json({
          status: true,
          message: "Users fetched",
          currentPage: page,
          totalUsers,
          data: rows,
        });
      } catch (err) {
        console.error("Error" + err);
        res.json({
          status: false,
          message: "Users not fetched",
        });
      }
    }
  }
);


module.exports = router;
