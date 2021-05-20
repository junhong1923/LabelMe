const router = require("express").Router();
const { upload, wrapAsync } = require("../../util/util");

// const oriUpload = upload.fields([{ name: "OriImage", maxCount: 2 }]);
const oriUpload = upload.single("OriImage");

const {
  getOriImage,
  getCoordinates
} = require("../controllers/label_controller");

router.route("/label/ori-image")
  .post(oriUpload, getOriImage);

router.route("/label/coordinates") // need to apply auth middleware in this route
  .post(getCoordinates);

module.exports = router;
