var express = require('express');
var router = express.Router();

// Register route
router.get('/register', (req, res) => {
 res.send('register successfull')
});

// Login route
router.get('/login', (req, res) => {
  res.send('login successfull')
});

module.exports = router;
