var express = require("express");
var router = express.Router();
const execute = require("../models/database/db");
const authMiddleware = require("../middleware/authmiddleware");
const { body, validationResult } = require("express-validator");

router.post(
  "/userRead",
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
            "SELECT COUNT(*) AS total FROM user WHERE status = 1 AND full_name = ?",
            [search]
          );
          rows = await execute(
            "SELECT * FROM user WHERE status = 1 AND full_name = ? LIMIT ? OFFSET ?",
            [search, limit, offset]
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
          totalRows = await execute("SELECT COUNT(*) AS total FROM user where status = 1", []);
          rows = await execute("SELECT * FROM user where status = 1 LIMIT ? OFFSET ?", [
            limit,
            offset,
          ]);
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

router.delete(
  "/userDelete",
  authMiddleware,
  [
    body("id")
      .notEmpty()
      .withMessage("Id is required")
      .bail()
      .isInt()
      .withMessage("Id must be a number"),
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
          "UPDATE user SET status = 0 WHERE id = ?",
          [id]
        );

        if (result.affectedRows > 0) {
          return res.json({
            status: true,
            message: `User ${id} deleted successfully`,
          });
        } else {
          return res.json({
            status: false,
            message: "User not foundor already deleted",
          });
        }
      } catch (err) {
        return res.json({
          status: false,
          message: "Something went wrong",
          error: err.message,
        });
      }
    }
  }
);

module.exports = router;
