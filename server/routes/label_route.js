const router = require("express").Router();
const { upload, wrapAsync } = require("../../util/util");

// const oriUpload = upload.fields([{ name: "OriImage", maxCount: 2 }]);
const oriUpload = upload.single("OriImage");

const {
  coordinates
} = require("../controllers/label_controller");

router.route("/label/coordinates")
  .post(oriUpload, coordinates);

// router.post("/label/coordinates", oriUpload, (req, res) => {
//   console.log(req);
//   //   console.log(req.files);
//   res.send("good");
// });

module.exports = router;
