const router = require("express").Router();
const { upload, uploadS3, authentication } = require("../../util/util");

// const oriUpload = upload.single("OriImage");
const oriUploadS3 = uploadS3.single("OriImage");

const {
  saveOriImage,
  saveCoordinates,
  loadLabels
} = require("../controllers/label_controller");

router.route("/label/ori-image")
  .post(authentication(), oriUploadS3, saveOriImage);

router.route("/label/coordinates")
  .post(authentication(), saveCoordinates);

router.route("/label/load-coordinates")
  .get(loadLabels);

module.exports = router;
