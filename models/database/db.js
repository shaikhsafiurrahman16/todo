const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',     
  user: 'root',          
  password: '',
  database: 'todo'   
});

connection.connect((err) => {
  if (err) {
    console.error('Database connection failed');
    return;
  }
  console.log('Database connected');
});

module.exports = connection;
