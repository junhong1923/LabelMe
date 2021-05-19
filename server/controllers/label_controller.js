const Label = require("../models/label_model");

const getOriImage = (req, res) => {
  console.log(req.file);
  res.status(200).send("got it");
  // to-do: 先驗證身份、存檔名或路徑到sql
};

const getCoordinates = (req, res) => {
  Label.insertCoordinates(req.body);
  res.status(200).send("insert coords");
};

module.exports = {
  getOriImage,
  getCoordinates
};
