const router = require("express").Router();
const { uploadS3, authentication } = require("../../util/util");
const { getImages, checkImageMiddleware, saveOriginalImage } = require("../controllers/image_controller");

const oriUploadS3 = uploadS3.single("OriImage");

router.route("/images/:type")
  .get(getImages);

router.route("/image/upload")
  .post(authentication(), checkImageMiddleware(), oriUploadS3, saveOriginalImage);

module.exports = router;
