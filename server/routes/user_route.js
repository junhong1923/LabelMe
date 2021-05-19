const router = require("express").Router();

const {
  wrapAsync
  // authentication
} = require("../../util/util");

const {
  signUp
} = require("../controllers/user_controller");

router.route("/user/signup")
  .post(wrapAsync(signUp));

module.exports = router;
