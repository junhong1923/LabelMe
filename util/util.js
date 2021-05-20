const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../server/models/user_model");

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // const userId = req.userId;
      const userId = "user1";
      const imagePath = path.join(__dirname, `../public/assets/${userId}`);
      console.log(imagePath);
      if (!fs.existsSync(imagePath)) {
        fs.mkdirSync(imagePath);
      }
      cb(null, imagePath);
    },
    // destination: "../public/assets/",
    filename: (req, file, cb) => {
      // console.log(file);
      cb(null, file.originalname);
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
      res.status(401).send({ error: "Unauthorized: no token" });
      return;
    }

    accessToken = accessToken.replace("Bearer ", "");
    if (accessToken === "null") {
      res.status(401).send({ error: "Unauthorized: no token" });
    }

    try {
      const user = jwt.verify(accessToken, process.env.TOKEN_SECRET);
      req.user = user;
      const userData = await User.getUserData(user.email);
      if (userData) {
        // req.user.id = userData.id;
        // req.user.role_id = userData.role_id;
        req.user.picture = userData.picture;
        next();
      } else {
        res.status(403).send({ error: "Cannot find your email account." });
      }
    } catch (error) {
      // console.log(error);
      res.status(403).send({ error: "Forbidden: TokenExpiredError" });
    }
  };
};

module.exports = {
  upload,
  wrapAsync,
  authentication
};
