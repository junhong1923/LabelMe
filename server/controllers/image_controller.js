const Image = require("../models/image_model");
const { insertApiCoordinates, getLabelTags } = require("../models/label_model");
const { getUserCapacity } = require("../models/user_model");
const utils = require("../../util/util");

const getImages = async (req, res) => {
  const type = req.params.type;
  const status = req.query.status;
  const userId = req.query.userid;
  console.log({ type, status, userId });

  try {
    const images = await Image.getImages(type, userId, status);
    const labelTags = await getLabelTags();

    const tagsObj = {};
    labelTags.forEach(labelTag => {
      if (labelTag.image_id in tagsObj) {
        if (!tagsObj[labelTag.image_id].includes(stringCapitalized(labelTag.tag))) {
          tagsObj[labelTag.image_id].push(stringCapitalized(labelTag.tag));
        }
      } else {
        tagsObj[labelTag.image_id] = [stringCapitalized(labelTag.tag)];
      }
    });

    images.forEach(image => {
      if (image.image_id.toString() in tagsObj) {
        image.tag = tagsObj[image.image_id.toString()];
      }
    });

    res.status(200).json(images);
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error...");
  }
};

const saveOriginalImage = async (req, res) => {
  const userId = req.user.id;
  const imgSize = (req.file.size / 1024).toFixed(2); // size unit：bytes => kb
  const imgPath = req.file.location;
  const imgFileName = req.file.originalname;

  try {
    const localizedAnnotations = await localizeObjects(req);

    const insertImage = await Image.insertOriginalImage(userId, imgSize, imgFileName, imgPath);
    console.log(insertImage);

    const imageId = insertImage.imageId;
    const insertApiIds = await insertApiCoordinates(imageId, localizedAnnotations);

    localizedAnnotations.forEach((annotation, idx) => { annotation.id = insertApiIds[idx]; });

    if (insertImage.result.changedRows === 1) {
      res.status(200).json({ userId, imgSize, imgPath, imageId, inference: localizedAnnotations });
    }
    res.send({ msg: "Image is not insert as expected..." });
  } catch (err) {
    console.log("catch error in controller: saveImg:");
    console.log(err.stack);
    res.status(500).send("Internal Server Error...");
  }
};

const checkUserCapacity = () => {
  return async function (req, res, next) {
    const userId = req.user.id;
    const usage = await getUserCapacity(userId);
    const usageLimit = 1024 * 1024 * 2; // 2GB
    if (usage > usageLimit) {
      res.status(423).send("Out of 2GB usage.");
      return;
    }
    next();
  };
};

async function localizeObjects (req) {
  const vision = require("@google-cloud/vision");

  try {
    const client = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });

    const bufferData = await utils.getS3BufferData(req.file);

    const request = {
      image: { content: bufferData }
    };

    const [result] = await client.objectLocalization(request);
    const objects = result.localizedObjectAnnotations;

    return objects;
  } catch (err) {
    console.log("catch error in func localizeObjects:");
    console.log(err.stack);
    return err;
  }
};

function stringCapitalized (string) {
  return string.charAt(0).toUpperCase() + string.toLowerCase().slice(1);
};

module.exports = {
  getImages,
  checkImageMiddleware: checkUserCapacity,
  saveOriginalImage
};
