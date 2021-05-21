const { pool } = require("./mysqlcon");

const insertOriginalImage = (userId, imgSize, imgPath) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) reject(err);
      conn.beginTransaction((err) => {
        if (err) {
          conn.rollback(() => { conn.release(); });
          reject(err);
        } else {
          // 1. insert userId, imgPath into original_image
          conn.query("INSERT INTO original_image SET image_path = ?, user_id = ?", [imgPath, userId], (err, result) => {
            if (err) {
              conn.rollback(() => { conn.release(); });
              reject(err);
            } else {
              // 2. insert imgSize(capacity累加) and update qty in user
              conn.query("UPDATE user SET img_qty = img_qty + 1, capacity = capacity + ? WHERE id = ?", [imgSize, userId], (err, result) => {
                if (err) {
                  conn.rollback(() => { conn.release(); });
                  reject(err);
                } else {
                  conn.commit((err) => {
                    if (err) {
                      conn.rollback(() => { conn.release(); });
                      reject(err);
                    } else {
                      // Success
                      conn.release();
                      resolve(result);
                    }
                  });
                }
              });
            }
          });
        }
      });
    });
  });
};

const insertCoordinates = (coordinates) => {
  return new Promise((resolve, reject) => {
    pool.query("INSERT INTO label_result SET type = ?, coordinates_xy = point(?,?), coordinates_wh = point(?,?), user_id = ?, image_id = ?", [coordinates.type, coordinates.x, coordinates.y, coordinates.width, coordinates.height, "test", 1], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

module.exports = {
  insertOriginalImage,
  insertCoordinates
};
