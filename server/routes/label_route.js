const router = require("express").Router();
const { upload, uploadS3, authentication } = require("../../util/util");

// const oriUpload = upload.single("OriImage");
const oriUploadS3 = uploadS3.single("OriImage");

const {
  getOriImage,
  getCoordinates
} = require("../controllers/label_controller");

router.route("/label/ori-image")
  .post(authentication(), oriUploadS3, getOriImage);

router.route("/label/coordinates") // need to apply auth middleware in this route
  .post(getCoordinates);

module.exports = router;
