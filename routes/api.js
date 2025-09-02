const express = require('express');
const app = express();

app.get('/api', (req, res) => {
  res.send('This is the About page');
});