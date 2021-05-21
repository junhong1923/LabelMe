const Label = require("../models/label_model");

const getOriImage = async (req, res) => {
  const userId = req.user.id;
  const imgSize = (req.file.size / 1024).toFixed(2); // 原始單位：bytes，先換算成kb
  const imgPath = req.file.location;
  const result = await Label.insertOriginalImage(userId, imgSize, imgPath);
  if (result.changedRows === 1) {
    res.status(200).json({ userId, imgSize, imgPath });
  }
};

const getCoordinates = (req, res) => {
  Label.insertCoordinates(req.body);
  res.status(200).send("insert coords");
};

module.exports = {
  getOriImage,
  getCoordinates
};
