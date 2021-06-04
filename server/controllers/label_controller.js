const Label = require("../models/label_model");

const saveOriImage = async (req, res) => {
  const userId = req.user.id;
  const imgSize = (req.file.size / 1024).toFixed(2); // 原始單位：bytes，先換算成kb
  const imgPath = req.file.location;
  const result = await Label.insertOriginalImage(userId, imgSize, imgPath);
  if (result.changedRows === 1) {
    res.status(200).json({ userId, imgSize, imgPath });
  }
};

const compareLabelsPair = (beforeLabels, afterLabels) => {
  const checkedLabelsArr = [];
  afterLabels.forEach(afterObj => {
    if (afterObj.labelId) {
      // 有 label_id 則要檢查 originalLabels, obj 是否重複
      beforeLabels.forEach(beforeObj => {
        if (afterObj.labelId === beforeObj.id) {
          if (afterObj.x === beforeObj.coordinates_xy.x && afterObj.y === beforeObj.coordinates_xy.y && afterObj.width === beforeObj.coordinates_wh.x && afterObj.height === beforeObj.coordinates_wh.y) {
            console.log("remove duplicated coordinate");
          } else {
            checkedLabelsArr.push(afterObj);
          }
        }
      });
    } else {
      checkedLabelsArr.push(afterObj);
    }
  });
  // console.log("----");
  // console.log(checkedLabelsArr);
  return checkedLabelsArr;
};

const saveCoordinates = async (req, res) => {
  const userId = req.user.id;
  // console.log(req.body);

  const originalLabels = req.body.before;
  const newLabels = req.body.after;
  const checkedLabels = compareLabelsPair(originalLabels, newLabels);

  const result = await Label.insertCoordinates(userId, checkedLabels);
  console.log(result.msg);
  if (result.msg) {
    res.status(200).send({ labeler: userId, msg: result.msg, checkedLabels });
  }
};

const loadLabels = async (req, res) => {
  console.log("controller");
  console.log(req.query);
  // const userId = req.query.user;
  const imgId = req.query.img;
  const result = await Label.queryLabels(imgId);
  if (result.length > 0) {
    res.status(200).send(result);
  } else {
    // console.log(result);
    res.status(200).send({ msg: "Label not found" });
  }
};

module.exports = {
  saveOriImage,
  saveCoordinates,
  loadLabels
};
