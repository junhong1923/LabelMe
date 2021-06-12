const router = require("express").Router();
const { authentication } = require("../../util/util");

const {
  saveCoordinates,
  getLabels,
  deleteLabel
} = require("../controllers/label_controller");

router.route("/label/coordinates")
  .post(authentication(), saveCoordinates);

router.route("/label/coordinates")
  .get(getLabels);

router.route("/label/coordinates/:labelId")
  .delete(authentication(), deleteLabel);

module.exports = router;
