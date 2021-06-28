const { pool, promiseQuery } = require("./mysqlcon");

const insertApiCoordinates = (imageId, localizedAnnotations) => {
  return new Promise((resolve, reject) => {
    async function processlocalizedAnnotations (array) {
      const finalResult = [];
      for (const annotation of array) {
        const vertices = annotation.boundingPoly.normalizedVertices;

        const bindings = [annotation.mid, annotation.name, annotation.score, vertices[0].x, vertices[0].y, vertices[1].x, vertices[1].y, vertices[2].x, vertices[2].y, vertices[3].x, vertices[3].y, imageId];
        const sql = "INSERT INTO api_inference SET mid = ?, name = ?, score = ?, normalizedVertices_0 = point(?,?), normalizedVertices_1 = point(?,?), normalizedVertices_2 = point(?,?), normalizedVertices_3 = point(?,?), image_id = ?";
        const result = await promiseQuery(sql, bindings);
        finalResult.push(result.insertId);
      }
      return finalResult;
    }
    const apiInsertId = processlocalizedAnnotations(localizedAnnotations);

    resolve(apiInsertId);
  });
};

const insertCoordinates = (userId, coordinates) => {
  return new Promise((resolve, reject) => {
    const STATUS = { labeled: 1, unlabeled: 0 };
    let isUpated = false;

    coordinates.forEach(coordinate => {
      if (!coordinate.labelId.toString().includes("fresh")) {
        isUpated = true;
      }
      const bindings = [coordinate.type, coordinate.tag, coordinate.x, coordinate.y, coordinate.width, coordinate.height, coordinate.scale.X, coordinate.scale.Y, userId, coordinate.imageId];
      pool.query("INSERT INTO label_result SET type = ?, tag = ?, coordinates_xy = point(?,?), coordinates_wh = point(?,?), scale = point(?,?), user_id = ?, image_id = ?", bindings, (err, result) => {
        if (err) reject(err);
      });
    });

    if (!isUpated) {
      pool.query("UPDATE original_image SET status = ? WHERE image_id = ?", [STATUS.labeled, coordinates[0].imageId], (err, result) => {
        if (err) reject(err);
        resolve({ result, msg: "Coordinates insert and status update" });
      });
    } else {
      resolve({ msg: "Coordinates insert only" });
    }
  });
};

const getLabelTags = () => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT image_id, tag FROM label_result ORDER BY image_id";
    pool.query(sql, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

const getLabelCount = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT COUNT(*) FROM label_result WHERE user_id = ?";
    pool.query(sql, userId, (err, result) => {
      if (err) reject(err);
      resolve(result[0]["COUNT(*)"]);
    });
  });
};

const getLabels = (imageId) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT d.status, d.id, d.image_id, d.tag, d.coordinates_xy, d.coordinates_wh, d.scale, u.name as labeler_name, d.labeler, d.owner FROM user u JOIN (SELECT * FROM (SELECT a.status, a.id, a.image_id, a.tag, coordinates_xy, coordinates_wh, scale, a.user_id as labeler, b.user_id as owner FROM label_result as a LEFT JOIN original_image as b ON a.image_id = b.image_id) as c WHERE c.status =1 and c.image_id = ?) as d on u.id = d.labeler";
    pool.query(sql, imageId, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

const getApiInference = (imageId) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT id, name, score, normalizedVertices_0, normalizedVertices_1, normalizedVertices_2, normalizedVertices_3 FROM api_inference WHERE image_id = ? and status = 1";
    pool.query(sql, imageId, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

const deleteApiLabel = (labelId) => {
  return new Promise((resolve, reject) => {
    const sql = "UPDATE api_inference SET status = 0 WHERE id = ?";
    pool.query(sql, labelId, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

const deleteUserLabel = (labelId) => {
  return new Promise((resolve, reject) => {
    const sql = "UPDATE label_result SET status = 0 WHERE id = ?";
    pool.query(sql, labelId, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

module.exports = {
  insertCoordinates,
  insertApiCoordinates,
  getLabelTags,
  getLabelCount,
  getLabels,
  getApiInference,
  deleteUserLabel,
  deleteApiLabel
};
