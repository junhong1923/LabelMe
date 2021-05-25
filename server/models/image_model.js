const { pool } = require("./mysqlcon");

const SHARE = { private: 0, share: 1 };

const getImages = () => {
  return new Promise((resolve, reject) => {
    pool.query("SELECT status, image_path, tag, share, private_folder FROM original_image ORDER BY image_id DESC", (err, result) => {
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
