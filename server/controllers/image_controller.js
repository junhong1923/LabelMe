const Image = require("../models/image_model");

const getImages = async (req, res) => {
  const type = req.params.type;
  const status = req.query.status;
  const userId = req.query.userid;
  console.log({ type, status, userId });

  const images = await Image.getImages(type, userId, status);
  res.status(200).json(images);
};

module.exports = { getImages };
