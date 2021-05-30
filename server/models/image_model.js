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

module.exports = { getImages };
