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
      .bail()
      .matches(/^[A-Za-z0-9 ]+$/)
      .withMessage("Title should only contain letters or numbers")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Title must be contain minimum 3 character"),
    body("duedate")
      .notEmpty()
      .withMessage("date is required")
      .isAfter(new Date().toISOString().split("s")[0])
      .withMessage("Please enter a correct date"),
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
      return res.json({
        status: false,
        message: errors.array().map((err) => err.msg),
      });
    } else {
      const { title, description, duedate, color, priorty } = req.body;
      console.log(req.body);
      try {
        await execute(
          "INSERT INTO second (title, description, duedate, color, priorty, user_id) VALUES (?, ?, ?, ?, ?, ?)",
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
router.get(
  "/read",
  authMiddleware,
  [
    body("page").isInt().withMessage("please insert a number"),
    body("limit").isInt().withMessage("please insert a number"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        status: false,
        message: errors.array().map((err) => err.msg),
      });
    } else {
      try {
        const page = parseInt(req.body.page || 1);
        const limit = parseInt(req.body.limit || 10);
        const offset = (page - 1) * limit;

        const totalRows = await execute(
          "SELECT COUNT(*) AS total FROM second WHERE user_id = ?",
          [req.user.userId]
        );
        const totalTodos = totalRows[0].total;

        const rows = await execute(
          "SELECT * FROM second WHERE user_id = ? LIMIT ? OFFSET ?",
          [req.user.userId, limit, offset]
        );

        res.json({
          status: true,
          message: "Data fetched",
          currentPage: page,
          totalPages: Math.ceil(totalTodos / limit),
          totalTodos,
          data: rows,
        });
      } catch (err) {
        console.error(err);
        res.json({
          status: false,
          message: "Data not fetched",
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
      return res.json({
        status: false,
        message: errors.array().map((err) => err.msg),
      });
    }
    const { id } = req.body;

    try {
      const result = await execute(
        "DELETE FROM second WHERE id = ? AND user_id = ?",
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
      .bail()
      .matches(/^[A-Za-z0-9 ]+$/)
      .withMessage("Title should only contain letters or numbers")
      .bail()
      .isLength({ min: 3 })
      .withMessage("Title must be contain minimum 3 character"),
    body("duedate")
      .notEmpty()
      .withMessage("date is required")
      .bail()
      .isAfter(new Date().toISOString().split("T")[0])
      .withMessage("Please enter a correct date"),
    body("color")
      .isIn(["red", "yellow", "green"])
      .withMessage("Select one of these red,yellow,green")
      .bail(),
    body("priorty")
      .isIn(["high", "medium", "low"])
      .withMessage("Select one of these high , low , medium"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        status: false,
        message: errors.array().map((err) => err.msg),
      });
    }
    const { id, title, description, duedate, color, priorty } = req.body;
    try {
      const result = await execute(
        `UPDATE second 
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
);

module.exports = router;
