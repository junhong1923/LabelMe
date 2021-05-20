const { pool } = require("./mysqlcon");

const insertCoordinates = (coordinates) => {
  return new Promise((resolve, reject) => {
    pool.query("INSERT INTO label_result SET type = ?, coordinates_xy = point(?,?), coordinates_wh = point(?,?), user_id = ?, image_id = ?", [coordinates.type, coordinates.x, coordinates.y, coordinates.width, coordinates.height, "test", 1], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

module.exports = {
  insertCoordinates
};
