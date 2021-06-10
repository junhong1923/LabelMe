const Image = require("../models/image_model");
const { insertApiCoordinates } = require("../models/label_model");
const utils = require("../../util/util");

const getImages = async (req, res) => {
  const type = req.params.type;
  const status = req.query.status;
  const userId = req.query.userid;
  console.log({ type, status, userId });

  const images = await Image.getImages(type, userId, status);
  res.status(200).json(images);
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
    console.log(imgResult);
    const imageId = imgResult.imageId;
    const apiResult = insertApiCoordinates(imageId, localizedAnnotations); // let it store to db async

    if (imgResult.result.changedRows === 1) {
      res.status(200).json({ userId, imgSize, imgPath, inference: localizedAnnotations });
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
