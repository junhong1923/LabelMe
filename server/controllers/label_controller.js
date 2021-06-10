const Label = require("../models/label_model");
const { queryImageOwner } = require("../models/image_model");

const compareLabelsPair = (beforeLabels, afterLabels) => {
  const checkedLabelsArr = [];
  afterLabels.forEach(afterObj => {
    if (afterObj.labelId.toString().includes("fresh")) {
      checkedLabelsArr.push(afterObj);
    } else {
      beforeLabels.forEach(beforeObj => {
        if (afterObj.labelId === beforeObj.id) { // 如果before本來的圖片沒標注，labels = [{owner, msg}]，可能有err
          if (afterObj.x === beforeObj.coordinates_xy.x && afterObj.y === beforeObj.coordinates_xy.y && afterObj.width === beforeObj.coordinates_wh.x && afterObj.height === beforeObj.coordinates_wh.y) {
            console.log("remove duplicated coordinate");
          } else {
            checkedLabelsArr.push(afterObj);
          }
        }
      });
    }
  });
  // console.log(checkedLabelsArr);
  return checkedLabelsArr;
};

const saveCoordinates = async (req, res) => {
  const userId = req.user.id;
  // console.log(req.body);

  const originalLabels = req.body.before;
  const newLabels = req.body.after;
  let checkedLabels;
  console.log(originalLabels === newLabels);

  try {
    if (originalLabels === newLabels) {
      console.log("condition 0");
      res.status(200).send({ msg: "Nothing new to submit" });
      return;
    } else if (originalLabels && originalLabels[0].id) { // condition: old img w labels
      console.log("condition 1");
      checkedLabels = compareLabelsPair(originalLabels, newLabels);
    } else if (originalLabels && !originalLabels[0].id) { // condition: old img w/o labels
      console.log("condition 2");
      checkedLabels = newLabels;
    } else if (originalLabels === undefined) { // condition: new upload img
      console.log("condition 3");
      checkedLabels = newLabels;
    }

    if (checkedLabels.length === 0) {
      console.log("condition 4");
      res.status(200).send({ msg: "Nothing new to submit" });
    } else {
      const result = await Label.insertCoordinates(userId, checkedLabels);
      console.log(result.msg);
      if (result.msg) {
        res.status(200).send({ labeler: userId, msg: result.msg, checkedLabels });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error...");
  }
};

const getLabels = async (req, res) => {
  console.log("label controller");
  console.log(req.query);
  // const userId = req.query.user;
  const imgId = req.query.img;
  const result = await Label.queryLabels(imgId);
  // console.log(result);
  if (result.length > 0) {
    res.status(200).send(result);
  } else {
    // result = []
    const imgOwner = await queryImageOwner(imgId);
    res.status(200).send([{ owner: imgOwner.owner, msg: "Label not found" }]);
  }
};

module.exports = {
  saveCoordinates,
  getLabels
};
