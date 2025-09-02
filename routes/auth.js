var express = require('express');
var router = express.Router();

// Register route
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  // Abhi database nahi hai, dummy response bhej rahe
  res.json({
    message: "User registered successfully",
    user: { username, email }
  });
});

// Login route
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Dummy login check
  if (email === "test@test.com" && password === "12345") {
    res.json({ message: "Login successful", token: "dummy-jwt-token" });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
});

module.exports = router;
