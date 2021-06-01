const { pool } = require("./mysqlcon");

// 5/25 need to check the total capacity before insert images
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

// 5/25 so far only bounding coordinates can be catch and save
const insertCoordinates = (userId, coordinates) => {
  return new Promise((resolve, reject) => {
    pool.query("INSERT INTO label_result SET type = ?, coordinates_xy = point(?,?), coordinates_wh = point(?,?), user_id = ?, image_id = ?", [coordinates.type, coordinates.x, coordinates.y, coordinates.width, coordinates.height, userId, coordinates.imageId], (err, result) => {
      if (err) reject(err);

      pool.query("UPDATE original_image SET status = ? WHERE image_id = ?", [1, coordinates.imageId], (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  });
};

const queryLabels = (imageId) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM (SELECT a.image_id, a.type, b.status, a.tag, coordinates_xy, coordinates_wh, a.user_id FROM label_result as a LEFT JOIN original_image as b ON a.image_id = b.image_id) as c WHERE c.image_id = ?";
    pool.query(sql, imageId, (err, result) => {
      if (err) reject(err);
      // console.log(result);
      resolve(result);
    });
  });
};

module.exports = {
  insertOriginalImage,
  insertCoordinates,
  queryLabels
};
