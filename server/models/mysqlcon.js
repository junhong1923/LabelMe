require("dotenv").config();
const mysql = require("mysql");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 20,
  multipleStatements: true
});

const promiseQuery = (sql, bindings) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, bindings, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

module.exports = {
  pool,
  promiseQuery
};
