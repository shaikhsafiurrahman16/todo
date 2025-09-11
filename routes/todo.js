var express = require("express");
var router = express.Router();
const execute = require("../models/database/db");
const authMiddleware = require("../middleware/authmiddleware");
const { body, validationResult } = require("express-validator");

router.post(
  "/create",
  authMiddleware,
  [
    body("title")
      .notEmpty()
      .withMessage("Title is required")
      .matches(/^[A-Za-z][A-Za-z0-9]*$/)
      .withMessage(
        "Title should only start with letter or contain letters or numbers"
      )
      .isLength({ min: 3 })
      .withMessage("Title must be contain minimum 3 character"),
    body("description")
      .notEmpty()
      .withMessage("description is required")
      .matches(/^[A-Za-z0-9][A-Za-z0-9\s!@#$%^&*(),.?":{}|<>-]*$/)
      .withMessage("Please enter a correct description"),
    body("duedate")
      .notEmpty()
      .withMessage("Date is required")
      .custom((value) => {
        const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
        if (!regex.test(value)) {
          throw new Error("Date and time required (YYYY-MM-DD HH:mm:ss)");
        }
        const timestamp = new Date(value).getTime();
        const now = Date.now();
        if (isNaN(timestamp)) {
          throw new Error("Invalid date format");
        }
        if (timestamp <= now) {
          throw new Error("Date must be in the future");
        } else {
          return true;
        }
      }),
    body("color")
      .isIn(["red", "yellow", "green"])
      .withMessage("Select one of these red,yellow,green"),
    body("priorty")
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
      const { title, description, duedate, color, priorty } = req.body;
      console.log(req.body);
      try {
        const existingTodo = await execute(
          "SELECT * FROM todos WHERE user_id = ? AND duedate = ?",
          [req.user.userId, duedate]
        );

        if (existingTodo.length > 0) {
          return res.json({
            status: false,
            message: "Task in this duedate is already created",
          });
        }

        await execute(
          "INSERT INTO todos (title, description, duedate, color, priorty, user_id) VALUES (?, ?, ?, ?, ?, ?)",
          [title, description, duedate, color, priorty, req.user.userId]
        );

        res.json({ status: true, message: "Todo inserted" });
      } catch (err) {
        console.error(err);
        res.json({
          status: false,
          message: "Insert failed",
        });
      }
    }
  }
);
router.post(
  "/read",
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
        const search = req.body.search || null;

        let totalRows, rows;

        if (search) {
          totalRows = await execute(
            "SELECT COUNT(*) AS total FROM todos WHERE user_id = ? AND title = ?",
            [req.user.userId, search]
          );
          rows = await execute(
            "SELECT * FROM todos WHERE user_id = ? AND title = ? LIMIT ? OFFSET ?",
            [req.user.userId, search, limit, offset]
          );
          if (rows.length === 0) {
            return res.json({
              status: false,
              message: "Todo not found",
            });
          } else {
            return res.json({
              status: true,
              message: "Todo fetched",
              currentPage: page,
              totalTodos: totalRows[0].total,
              data: rows,
            });
          }
        } else {
          totalRows = await execute(
            "SELECT COUNT(*) AS total FROM todos WHERE user_id = ?",
            [req.user.userId]
          );
          rows = await execute(
            "SELECT * FROM todos WHERE user_id = ? LIMIT ? OFFSET ?",
            [req.user.userId, limit, offset]
          );
        }

        const totalTodos = totalRows[0].total;

        res.json({
          status: true,
          message: "Todo fetched",
          currentPage: page,
          totalTodos,
          data: rows,
        });
      } catch (err) {
        console.error(err);
        res.json({
          status: false,
          message: "Todo not fetched",
        });
      }
    }
  }
);
router.delete(
  "/delete",
  authMiddleware,
  [
    body("id")
      .notEmpty()
      .withMessage("Id is required")
      .bail()
      .isInt()
      .withMessage("Id must be contains a number"),
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
      const { id } = req.body;

      try {
        const result = await execute(
          "UPDATE todos SET status = 0 WHERE id = ? AND user_id = ?",
          [id, req.user.userId]
        );

        if (result.affectedRows > 0) {
          res.json({
            status: true,
            message: `Id ${id} deleted successfully`,
          });
        } else {
          res.json({
            status: false,
            message: `Not allowed or Todo not found`,
          });
        }
      } catch (err) {
        console.error(err);
        res.json({
          status: false,
          message: "Invalid",
          error: err.message,
        });
      }
    }
  }
);
router.put(
  "/update",
  authMiddleware,
  [
    body("id")
      .notEmpty()
      .withMessage("Id is required")
      .bail()
      .isInt()
      .withMessage("Id must be contains a number"),
    body("title")
      .notEmpty()
      .withMessage("Title is required")
      .matches(/^[A-Za-z][A-Za-z0-9]*$/)
      .withMessage(
        "Title should only start with letter or contain letters or numbers"
      )
      .isLength({ min: 3 })
      .withMessage("Title must be contain minimum 3 character"),
    body("duedate")
      .notEmpty()
      .withMessage("date is required")
      .custom((value) => {
        const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
        if (!regex.test(value)) {
          throw new Error("Date and time required (YYYY-MM-DD HH:mm:ss)");
        }
        const timestamp = new Date(value).getTime();
        const now = Date.now();
        if (isNaN(timestamp)) {
          throw new Error("Invalid date format");
        }
        if (timestamp <= now) {
          throw new Error("Date must be in the future");
        } else {
          return true;
        }
      }),
    body("color")
      .isIn(["red", "yellow", "green"])
      .withMessage("Select one of these red,yellow,green"),
    body("priorty")
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
      const { id, title, description, duedate, color, priorty } = req.body;
      try {
        const result = await execute(
          `UPDATE todos 
       SET title = ?, description = ?, duedate = ?, color = ?, priorty = ?, updatedAt = NOW() 
       WHERE id = ? AND user_id = ?`,
          [title, description, duedate, color, priorty, id, req.user.userId]
        );

        if (result.affectedRows > 0) {
          res.json({ status: true, message: `Id ${id} updated successfully` });
        } else {
          res.json({
            status: false,
            message: `Not allowed or Todo not found`,
          });
        }
      } catch (err) {
        console.error(err);
        res.json({
          status: false,
          message: "Update failed",
          error: err.message,
        });
      }
    }
  }
);

module.exports = router;
