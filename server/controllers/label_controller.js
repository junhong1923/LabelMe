const Label = require("../models/label_model");
const { getImageOwner } = require("../models/image_model");

function compareCoordinates (newLabel, originalLabel, newScale = { X: 1, Y: 1 }, originalScale = { x: 1, y: 1 }) {
  if (newLabel.x * newScale.X === originalLabel.coordinates_xy.x.toFixed(2) * originalScale.x && newLabel.y * newScale.Y === originalLabel.coordinates_xy.y.toFixed(2) * originalScale.y && newLabel.width * newScale.X === originalLabel.coordinates_wh.x.toFixed(2) * originalScale.x && newLabel.height * newScale.Y === originalLabel.coordinates_wh.y.toFixed(2) * originalScale.y) {
    return true;
  } else {
    return false;
  }
}

function compareLabelsPair (originalLabels, newLabels) {
  const checkedLabels = [];
  newLabels.forEach(newLabel => {
    if (newLabel.labelId.toString().includes("fresh")) {
      checkedLabels.push(newLabel);
    } else {
      originalLabels.forEach(originalLabel => {
        if (newLabel.labelId === originalLabel.id) {
          const newScale = newLabel.scale;

          if (newLabel.labelId.toString().includes("inference")) {
            if (compareCoordinates(newLabel, originalLabel, newScale) === false) {
              checkedLabels.push(newLabel);
            }
          } else {
            const originalScale = originalLabel.scale;
            if (compareCoordinates(newLabel, originalLabel, newScale, originalScale) === false) {
              checkedLabels.push(newLabel);
            }
          }
        }
      });
    }
  });

  return checkedLabels;
};

const saveCoordinates = async (req, res) => {
  const userId = req.user.id;

  const originalLabels = req.body.before;
  const newLabels = req.body.after;
  let checkedLabels;

  try {
    if (originalLabels === newLabels) {
      res.status(200).send({ msg: "Nothing new to submit" });
      return;
    } else if (originalLabels && originalLabels[0].id) { // condition: old img w labels (add new label or label is modified)
      checkedLabels = compareLabelsPair(originalLabels, newLabels);
    } else if (originalLabels === undefined) { // condition: new upload img
      checkedLabels = newLabels;
    }

    if (checkedLabels.length === 0) {
      res.status(200).send({ msg: "Nothing new to submit" });
    } else {
      const insertResult = await Label.insertCoordinates(userId, checkedLabels);
      if (insertResult.msg) {
        res.status(200).send({ labeler: userId, msg: insertResult.msg, checkedLabels });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error...");
  }
};

const getLabels = async (req, res) => {
  const imgId = req.query.img;

  try {
    const userLabels = await Label.getLabels(imgId);
    let apiLabels = await Label.getApiInference(imgId);

    if (apiLabels.length > 0) {
      apiLabels = apiLabels.map(apiLabel => {
        return {
          id: apiLabel.id,
          name: apiLabel.name,
          score: apiLabel.score,
          boundingPoly: {
            normalizedVertices: [apiLabel.normalizedVertices_0, apiLabel.normalizedVertices_1, apiLabel.normalizedVertices_2, apiLabel.normalizedVertices_3]
          }
        };
      });
    }

    if (userLabels.length > 0 || apiLabels.length > 0) {
      res.status(200).send({ userLabel: userLabels, apiLabel: apiLabels });
      return;
    } else {
      const imgOwner = await getImageOwner(imgId);
      res.status(200).send([{ owner: imgOwner.owner, msg: "Label not found" }]);
      return;
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error...");
  }
};

const deleteLabel = async (req, res) => {
  const labelId = req.params.labelId;

  let deleteResult;

  try {
    if (labelId.includes("inference")) {
      // api inference
      deleteResult = await Label.deleteApiLabel(labelId.split("_")[1]);
    } else {
      // user label
      deleteResult = await Label.deleteUserLabel(labelId);
    }

    if (deleteResult.changedRows === 1) {
      res.status(204).send({ msg: `${labelId} has been deleted...` });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error...");
  }
};

module.exports = {
  compareLabelsPair,
  compareCoordinates,
  saveCoordinates,
  getLabels,
  deleteLabel
};
