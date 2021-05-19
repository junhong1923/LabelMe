const { pool } = require("./mysqlcon");

const insertCoordinates = (coordinates) => {
  return new Promise((resolve, reject) => {
    const post = { type: coordinates.type, coordinate_x: coordinates.x, coordinate_y: coordinates.y, coordinate_width: coordinates.width, coordinate_height: coordinates.height, user_id: "test", image_id: 1 };
    pool.query("INSERT INTO label_result SET ?", post, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

module.exports = {
  insertCoordinates
};
