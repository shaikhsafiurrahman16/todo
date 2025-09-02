const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "todo",
});

connection.connect((err) => {
  if (err) return console.log(err);
  console.log("Database Connected!");
});

function execute(query, values) {
  return new Promise((resolve, reject) => {
    connection.query(query, values, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
  });
}

module.exports = execute;
