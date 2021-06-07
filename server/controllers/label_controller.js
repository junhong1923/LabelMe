const Label = require("../models/label_model");
const utils = require("../../util/util");
const fs = require("fs");
const sharp = require("sharp");

function writePredictions (objects) {
  fs.writeFile("../../test.json", objects, (err) => {
    if (err) console.log(err);
  });
}

const localizeObjects = async (req) => {
  console.log("localizeObjects:");
  // console.log(req.file.location);
  const bufferData = await utils.getS3BufferData(req.file);
  console.log(typeof sharp(bufferData));
  // console.log(sharp(bufferData));

  const encoded = Buffer.from(bufferData).toString("base64");
  console.log(typeof encoded);

  // Imports the Google Cloud client library
  const vision = require("@google-cloud/vision");

  // Creates a client
  // Instantiates a client. If you don't specify credentials when constructing
  // the client, the client library will look for credentials in the
  // environment.
  // const client = new vision.ImageAnnotatorClient();
  const client = new vision.ImageAnnotatorClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
  });

  // const request = {
  //   image: { content: sharp(bufferData) }
  // };
  const request = {
    image: {
      content: sharp(bufferData)
    },
    features: [
      {
        type: "OBJECT_LOCALIZATION"
        // maxResults: 10
      }
    ]
  };

  // const a = {
  //   requests: [
  //     {
  //       image: {
  //         source: {
  //           imageUri:
  //             req.file.location
  //         }
  //       },
  //       features: [
  //         {
  //           type: "LOGO_DETECTION"
  //           // maxResults: 1
  //         }
  //       ]
  //     }
  //   ]
  // };
  // const [result] = await client.objectLocalization(request);
  const [result] = await client.annotateImage(request);
  const objects = result.localizedObjectAnnotations;
  writePredictions(objects);

  console.log(objects);
  objects.forEach(object => {
    console.log(`Name: ${object.name}`);
    console.log(`Confidence: ${object.score}`);
    const vertices = object.boundingPoly.normalizedVertices;
    vertices.forEach(v => console.log(`x: ${v.x}, y:${v.y}`));
  });
  return objects;
};

const saveOriImage = async (req, res) => {
  const userId = req.user.id;
  const imgSize = (req.file.size / 1024).toFixed(2); // 原始單位：bytes，先換算成kb
  const imgPath = req.file.location;
  const imgFileName = req.file.originalname;

  console.log("label controller");
  console.log(req.file);
  // const predictLabels = await localizeObjects(req);

  const result = await Label.insertOriginalImage(userId, imgSize, imgFileName, imgPath);
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
