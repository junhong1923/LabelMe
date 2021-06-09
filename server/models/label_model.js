const { pool } = require("./mysqlcon");

// 5/25 need to check the total capacity before insert images
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

const insertApiCoordinates = (imageId, localizedAnnotations) => {
  return new Promise((resolve, reject) => {
    // console.log("model");

    const finalResult = [];
    localizedAnnotations.forEach(obj => {
      const vertices = obj.boundingPoly.normalizedVertices;

      const bindings = [obj.mid, obj.languageCode, obj.name, obj.score, vertices[0].x, vertices[0].y, vertices[1].x, vertices[1].y, vertices[2].x, vertices[2].y, vertices[3].x, vertices[3].y, imageId];
      // console.log(bindings);
      const sql = "INSERT INTO api_inference SET mid = ?, languageCode = ?, name = ?, score = ?, normalizedVertices_0 = point(?,?), normalizedVertices_1 = point(?,?), normalizedVertices_2 = point(?,?), normalizedVertices_3 = point(?,?), image_id = ?";
      pool.query(sql, bindings, (err, result) => {
        if (err) reject(err);
        // console.log(result);
        finalResult.push(result);
      });
    });
    resolve(finalResult);
  });
};

const insertCoordinates = (userId, coordinates) => {
  return new Promise((resolve, reject) => {
    console.log("model");
    // console.log(coordinates);

    let isUpated = false;
    coordinates.forEach(obj => {
      if (!obj.labelId.toString().includes("fresh")) {
        isUpated = true;
      }
      const bindings = [obj.type, obj.tag, obj.x, obj.y, obj.width, obj.height, obj.scale.X, obj.scale.Y, userId, obj.imageId];
      pool.query("INSERT INTO label_result SET type = ?, tag = ?, coordinates_xy = point(?,?), coordinates_wh = point(?,?), scale = point(?,?), user_id = ?, image_id = ?", bindings, (err, result) => {
        if (err) reject(err);
      });
    });
    if (!isUpated) {
      // 代表沒upadte過original table
      pool.query("UPDATE original_image SET status = ? WHERE image_id = ?", [1, coordinates[0].imageId], (err, result) => {
        if (err) reject(err);
        resolve({ result, msg: "Coordinates insert and status update" });
      });
    } else {
      resolve({ msg: "Coordinates insert only" });
    }
  });
};

const queryLabels = (imageId) => {
  return new Promise((resolve, reject) => {
    // const sql = "SELECT * FROM (SELECT a.id, a.image_id, a.type, b.status, a.tag, coordinates_xy, coordinates_wh, a.user_id FROM label_result as a LEFT JOIN original_image as b ON a.image_id = b.image_id) as c WHERE c.image_id = ?";
    const sql = "SELECT * FROM (SELECT a.id, a.image_id, a.tag, coordinates_xy, coordinates_wh, scale, a.user_id as labeler, b.user_id as owner FROM label_result as a LEFT JOIN original_image as b ON a.image_id = b.image_id) as c WHERE c.image_id = ?";
    pool.query(sql, imageId, (err, result) => {
      if (err) reject(err);
      // console.log(result);

      // 想找出不重複的userId，然後再去撈userName
      if (result.length > 0) {
        const userIdSet = new Set();
        userIdSet.add(result[0].owner);
        result.forEach(obj => {
          userIdSet.add(obj.labeler);
        });
        // console.log(Array.from(userIdSet));
        // 然後再去user那query name
      }

      resolve(result);
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
  insertOriginalImage,
  insertApiCoordinates,
  insertCoordinates,
  queryLabels,
  queryImageOwner
};
