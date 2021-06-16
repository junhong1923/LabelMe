const multer = require("multer");
const path = require("path");
const fs = require("fs");

const AWS = require("aws-sdk");
const multerS3 = require("multer-s3-v3");
const s3 = new AWS.S3({
  accessKeyId: process.env.AWSAccessKeyId,
  secretAccessKey: process.env.AWSSecretKey
});

const jwt = require("jsonwebtoken");
const User = require("../server/models/user_model");

const upload = multer({
  limits: { fileSize: 1024 * 1024 * 2 },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const userId = req.user.id;
      const imagePath = path.join(__dirname, `../public/assets/${userId}`);
      if (!fs.existsSync(imagePath)) {
        fs.mkdirSync(imagePath);
      }
      cb(null, imagePath);
    },
    filename: (req, file, cb) => {
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
      const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
      const timeStr = `${year}-${month}-${day}`;
      const savePath = `${timeStr}_${file.originalname}`;
      cb(null, savePath);
    }
  })
});

const uploadS3 = multer({
  limits: { fileSize: 1024 * 1024 * 2 }, // limit uploaded file size within 2mb = 2000000 bytes
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    mimetype: "image/png",
    key: function (req, file, cb) {
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
      const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
      const timeStr = `${year}-${month}-${day}`;
      const savePath = `raw-images/${req.user.id}/${timeStr}_${file.originalname}`; // The name of the file
      cb(null, savePath);
    }
  })
});

// reference: https://thecodebarbarian.com/80-20-guide-to-express-error-handling
const wrapAsync = (fn) => {
  return function (req, res, next) {
    // Make sure to `.catch()` any errors and pass them along to the `next()`
    // middleware in the chain, in this case the error handler.
    fn(req, res, next).catch(next);
  };
};

const authentication = (roleId) => {
  return async function (req, res, next) {
    // Returns the specified HTTP request header field
    let accessToken = req.get("Authorization");
    if (!accessToken) {
      res.status(401).send({ error: "Unauthorized: no token, please Login." });
      return;
    }

    accessToken = accessToken.replace("Bearer ", "");
    if (accessToken === "null") {
      res.status(401).send({ error: "Unauthorized: Bearer is null, please Login." });
      return;
    }

    try {
      const user = jwt.verify(accessToken, process.env.TOKEN_SECRET);
      req.user = user;
      const userData = await User.getUserData(user.email);
      if (userData) {
        // console.log(userData);
        req.user.id = userData.id;
        // req.user.role_id = userData.role_id;
        req.user.picture = userData.picture;
        req.user.img_qty = userData.img_qty;
        req.user.capacity = userData.capacity;
        next();
      } else {
        res.status(403).send({ error: "Cannot find your email account." });
      }
    } catch (error) {
      console.log(error);
      res.status(403).send({ error });
    }
  };
};

const writePredictions = (objects, filename) => {
  const data = JSON.stringify(objects);

  fs.writeFile(filename, data, (err) => {
    if (err) console.log(err);
  });
};

const getS3BufferData = (multerData) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: multerData.key
    };

    s3.getObject(params, (err, data) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      resolve(data.Body);
    });
  });
};

module.exports = {
  upload,
  uploadS3,
  writePredictions,
  getS3BufferData,
  wrapAsync,
  authentication
};
