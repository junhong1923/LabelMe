const multer = require("multer");
const path = require("path");
const fs = require("fs");

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

module.exports = {
  upload,
  wrapAsync
};
