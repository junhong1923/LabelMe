const router = require("express").Router();
const { upload, uploadS3, authentication } = require("../../util/util");

// const oriUpload = upload.single("OriImage");
const oriUploadS3 = uploadS3.single("OriImage");

const { getImages, saveOriginalImage } = require("../controllers/image_controller");

router.route("/images/:type")
  .get(getImages);

router.route("/image/upload")
  .post(authentication(), oriUploadS3, saveOriginalImage);

module.exports = router;
