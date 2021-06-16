const { pool } = require("./mysqlcon");

const SHARE = { private: 0, public: 1 };

const getImages = (type, userId, status) => {
  return new Promise((resolve, reject) => {
    const condition = { sql: "", binding: [] };
    if (type === "private" && userId) {
      condition.sql = "WHERE user_id = ?";
      condition.binding = [userId];
      if (status !== undefined) {
        condition.sql += ` and status = ${status}`;
      }
    } else if (type === "public") {
      condition.sql = "WHERE share = ?";
      condition.binding = [SHARE[type]];
      if (status !== "undefined") {
        condition.sql += ` and status = ${status}`;
      }
    }
    const ImgaeQuery = `SELECT image_id, status, image_path, tag, share, private_folder FROM original_image ${condition.sql} ORDER BY image_id DESC`;
    pool.query(ImgaeQuery, condition.binding, (err, result) => {
      if (err) reject(err);
      if (result.length > 0) {
        resolve(result);
      } else {
        resolve({ error: "Image Not Found" });
      }
    });
  });
};

const insertOriginalImage = (userId, imgSize, imgFileName, imgPath) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) reject(err);
      conn.beginTransaction((err) => {
        if (err) {
          conn.rollback(() => { conn.release(); });
          reject(err);
        } else {
          // 1. insert userId, imgPath into original_image
          conn.query("INSERT INTO original_image SET file_name = ?, image_path = ?, user_id = ?", [imgFileName, imgPath, userId], (err, result) => {
            if (err) {
              conn.rollback(() => { conn.release(); });
              reject(err);
            } else {
              const imageId = result.insertId;
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
                      resolve({ imageId, result });
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

const queryImageOwner = (imageId) => {
  return new Promise((resolve, reject) => {
    pool.query("SELECT user_id as owner FROM original_image WHERE image_id = ?", [imageId], (err, result) => {
      if (err) reject(err);
      resolve(result[0]);
    });
  });
};

module.exports = {
  getImages,
  insertOriginalImage,
  queryImageOwner
};
