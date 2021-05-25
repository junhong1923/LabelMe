const router = require("express").Router();

const { getImages } = require("../controllers/image_controller");

router.route("/images/:type")
  .get(getImages);

module.exports = router;
