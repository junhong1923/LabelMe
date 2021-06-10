const router = require("express").Router();
const { authentication } = require("../../util/util");

const {
  saveCoordinates,
  getLabels
} = require("../controllers/label_controller");

router.route("/label/coordinates")
  .post(authentication(), saveCoordinates);

router.route("/label/coordinates")
  .get(getLabels);

module.exports = router;
