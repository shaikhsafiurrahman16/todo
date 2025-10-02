var express = require("express");
var router = express.Router();
const execute = require("../models/database/db");
const authMiddleware = require("../middleware/authmiddleware");
const { body, validationResult } = require("express-validator");


// user role
router.get("/info", authMiddleware, async (req, res) => {
  
  try {
    const rows = await execute(
      "SELECT Id, full_name, email, role FROM user WHERE Id = ?",
      [req.user.id]  
    );
    console.log(req.user)
    if (rows.length === 0) {
      return res.json({ status: false, message: "User not found" });
    }
    res.json({
      status: true,
      user: rows[0],
    });
  } catch (err) {
    console.error(err);
    res.json({ status: false, message: "Something went wrong" });
  }
});


// User Read
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

// User Delete
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

//user Edit
router.put(
  "/userUpdate",
  authMiddleware,
  [
    body("id")
      .notEmpty()
      .withMessage("Id is required")
      .bail()
      .isInt()
      .withMessage("Id must be contains a number"),
      body("full_name")
      .notEmpty()
      .withMessage("Full name is required")
      .isString()
      .bail()
      .matches(/^[A-Za-z]{3}[A-Za-z0-9\s]*$/)
      .withMessage("Full name is invalid"),
    body("email")
      .isEmail()
      .withMessage("Valid email is required")
      .bail()
      .matches(/^[A-Za-z][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
      .withMessage("Email format is invalid"),
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
      const { id, full_name, email, } = req.body;
      try {
        const result = await execute(
          `UPDATE user 
       SET full_name = ?, email = ?, updatedAt = NOW() 
       WHERE id = ? `,
          [full_name, email, id]
        );

        if (result.affectedRows > 0) {
          res.json({ status: true, message: `Id ${id} updated successfully` });
        } else {
          res.json({
            status: false,
            message: `Not allowed or User not found`,
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
