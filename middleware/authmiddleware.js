const jwt = require("jsonwebtoken");
const seckey = "mysecretkey";

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.json({
      status: false,
      message: "Authorization header missing",
    });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return res.json({
      status: false,
      message: "Invalid token text",
    });
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, seckey);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: "Invalid Token",
    });
  }
}


module.exports = authMiddleware;
