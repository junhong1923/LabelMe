const Image = require("../models/image_model");

const getImages = async (req, res) => {
  const type = req.params.type;
  const tag = req.query.tag;
  console.log({ type, tag });
  const images = await Image.getImages();
  res.status(200).json(images);
};

module.exports = { getImages };
