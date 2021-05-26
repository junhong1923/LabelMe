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

const saveCoordinates = async (req, res) => {
  const userId = req.user.id;
  const coordinates = req.body;
  const result = await Label.insertCoordinates(userId, coordinates);

  if (result.affectedRows === 1) {
    res.status(200).send({ userId, coordinates });
  } else {
    res.status(500).send({ error: "Something wrong when insert coordinates" });
  }
};

const loadLabels = async (req, res) => {
  console.log("controller");
  console.log(req.query);
  // const userId = req.query.user;
  const imgId = req.query.img;
  const result = await Label.queryLabels(imgId);
  if (result.length > 0) {
    res.status(200).send(result[0]);
  } else {
    console.log(result);
    res.status(200).send({ msg: "Label not found" });
  }
};

module.exports = {
  saveOriImage,
  saveCoordinates,
  loadLabels
};
