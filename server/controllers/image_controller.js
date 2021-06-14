const Image = require("../models/image_model");
const { insertApiCoordinates, getLabelTags } = require("../models/label_model");
// const Label = require("../models/label_model");
const utils = require("../../util/util");

const getImages = async (req, res) => {
  const type = req.params.type;
  const status = req.query.status;
  const userId = req.query.userid;
  console.log({ type, status, userId });

  try {
    const images = await Image.getImages(type, userId, status);
    const imageTags = await getLabelTags();

    const tagsObj = {};
    imageTags.forEach(obj => {
      if (obj.image_id in tagsObj) {
        if (!tagsObj[obj.image_id].includes(obj.tag.charAt(0).toUpperCase() + obj.tag.toLowerCase().slice(1))) {
          tagsObj[obj.image_id].push(obj.tag.charAt(0).toUpperCase() + obj.tag.toLowerCase().slice(1));
        }
      } else {
        tagsObj[obj.image_id] = [obj.tag.charAt(0).toUpperCase() + obj.tag.toLowerCase().slice(1)];
      }
    });
    // console.log(tagsObj);

    images.forEach(obj => {
      if (obj.image_id.toString() in tagsObj) {
        // console.log(obj.image_id);
        // console.log(tagsObj[obj.image_id.toString()]);
        obj.tag = tagsObj[obj.image_id.toString()];
      }
    });
    // console.log(images);
    res.status(200).json(images);
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error...");
  }
};

const saveOriginalImage = async (req, res) => {
  const userId = req.user.id;
  const imgSize = (req.file.size / 1024).toFixed(2); // 原始單位：bytes，先換算成kb
  const imgPath = req.file.location;
  const imgFileName = req.file.originalname;

  console.log("label controller");
  // console.log(req.file);
  try {
    const localizedAnnotations = await localizeObjects(req);
    console.log(`Google api get ${localizedAnnotations.length} predictions.`);
    // 5/25 need to check the total capacity before insert images
    const imgResult = await Image.insertOriginalImage(userId, imgSize, imgFileName, imgPath);
    // console.log(imgResult);
    const imageId = imgResult.imageId;

    const apiInsertId = await insertApiCoordinates(imageId, localizedAnnotations);
    // console.log(apiInsertId); // 6/14 這樣才能知道insert的labelId，這要拿去給render canvas用的、以及日後刪除需要用...

    localizedAnnotations.forEach((obj, idx) => { obj.id = apiInsertId[idx]; });

    if (imgResult.result.changedRows === 1) {
      res.status(200).json({ userId, imgSize, imgPath, imageId, inference: localizedAnnotations });
    }
  } catch (err) {
    console.log("inside controller saveImg:");
    console.log(err.stack);
    res.status(500).send("Internal Server Error...");
  }
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
    // console.log(result);
    // 先不要寫檔，怕速度太慢
    // const filePath = path.join(__dirname, `../../label_json/api_inference/prediction_${req.file.originalname.split(".")[0]}.json`);
    // console.log(filePath);
    // utils.writePredictions(result, filePath);

    const objects = result.localizedObjectAnnotations;

    return objects;
  } catch (err) {
    console.log("inside func localizeObjects:");
    console.log(err.stack);
    return err;
  }
};

module.exports = { getImages, saveOriginalImage };
