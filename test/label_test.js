/* eslint-disable no-undef */
const { assert } = require("./set_up");
const { compareCoordinates, compareLabelsPair } = require("../server/controllers/label_controller");

describe("Label", () => {
  // compareCoordinates func: return true if two coordinates are the same
  describe("compareCoordinates()", () => {
    it("should return true if two coordinates are the same", () => {
      const data = {
        newLabel: { x: 315.21, y: 149.42, width: 409.43, height: 492.97 },
        newScale: { X: 1, Y: 1 },
        originalLabel: { coordinates_xy: { x: 315.21, y: 149.42 }, coordinates_wh: { x: 409.43, y: 492.97 } },
        originalScale: { x: 1, y: 1 }
      };
      const result = compareCoordinates(data.newLabel, data.originalLabel, data.newScale, data.originalScale);
      assert.isTrue(result, "two coordinates are the same");
    });

    it("should return true if two coordinates are the same, even though without passing scale", () => {
      const data = {
        newLabel: { x: 315.21, y: 149.42, width: 409.43, height: 492.97 },
        originalLabel: { coordinates_xy: { x: 315.21, y: 149.42 }, coordinates_wh: { x: 409.43, y: 492.97 } }
      };
      const result = compareCoordinates(data.newLabel, data.originalLabel);
      assert.isTrue(result, "two coordinates are the same");
    });

    it("should return true if two coordinates are the same, even though coordinates are not round off to decimal place", () => {
      const data = {
        newLabel: { x: 315.21, y: 149.42, width: 409.43, height: 492.97 },
        originalLabel: { coordinates_xy: { x: 315.213456, y: 149.421234 }, coordinates_wh: { x: 409.432222, y: 492.974444 } }
      };
      const result = compareCoordinates(data.newLabel, data.originalLabel);
      assert.isTrue(result, "two coordinates are the same");
    });
  });

  // compareLabelsPair func: compare API inference labels and return checkedLabels
  describe("compareLabelsPair()", () => {
    it("new upload image", () => {
      const data = {
        newLabels: [
          { labelId: "inference_304", imageId: NaN, tag: "Person", x: 315.21, y: 149.42, width: 409.43, height: 492.97, scale: { X: 1, Y: 1 } },
          { labelId: "inference_305", imageId: NaN, tag: "Top", x: 325.09, y: 353.02, width: 389.44, height: 292.42, scale: { X: 1, Y: 1 } },
          { labelId: "inference_306", imageId: NaN, tag: "Hat", x: 448.76, y: 212.47, width: 156.09, height: 175.38, scale: { X: 1, Y: 1 } }
        ],
        originalLabels: [
          { id: "inference_304", imageId: NaN, labeler: "ai", owner: 1, tag: "Person", coordinates_xy: { x: 315.210018157959, y: 149.4214415550232 }, coordinates_wh: { x: 409.43262100219727, y: 492.96584129333496 } },
          { id: "inference_305", imageId: NaN, labeler: "ai", owner: 1, tag: "Top", coordinates_xy: { x: 325.09191513061523, y: 353.01705598831177 }, coordinates_wh: { x: 389.43986892700195, y: 292.4248695373535 } },
          { id: "inference_306", imageId: NaN, labeler: "ai", owner: 1, tag: "Hat", coordinates_xy: { x: 448.7643623352051, y: 212.47409582138062 }, coordinates_wh: { x: 156.08976364135742, y: 175.37527084350586 } }
        ]
      };
      const checkedLabels = compareLabelsPair(data.originalLabels, data.newLabels);
      assert.lengthOf(checkedLabels, 0, "if length of checkedLabels is 0, it means coordinates all match.");
    });

    it("new upload image with new fresh label", () => {
      const data = {
        newLabels: [
          { labelId: "inference_304", imageId: NaN, tag: "Person", x: 315.21, y: 149.42, width: 409.43, height: 492.97, scale: { X: 1, Y: 1 } },
          { labelId: "inference_305", imageId: NaN, tag: "Top", x: 325.09, y: 353.02, width: 389.44, height: 292.42, scale: { X: 1, Y: 1 } },
          { labelId: "inference_306", imageId: NaN, tag: "Hat", x: 448.76, y: 212.47, width: 156.09, height: 175.38, scale: { X: 1, Y: 1 } },
          { labelId: "fresh_0", imageId: NaN, tag: "test", x: 245, y: 395, width: 95, height: 89, scale: { X: 1, Y: 1 } }
        ],
        originalLabels: [
          { id: "inference_304", imageId: NaN, labeler: "ai", owner: 1, tag: "Person", coordinates_xy: { x: 315.210018157959, y: 149.4214415550232 }, coordinates_wh: { x: 409.43262100219727, y: 492.96584129333496 } },
          { id: "inference_305", imageId: NaN, labeler: "ai", owner: 1, tag: "Top", coordinates_xy: { x: 325.09191513061523, y: 353.01705598831177 }, coordinates_wh: { x: 389.43986892700195, y: 292.4248695373535 } },
          { id: "inference_306", imageId: NaN, labeler: "ai", owner: 1, tag: "Hat", coordinates_xy: { x: 448.7643623352051, y: 212.47409582138062 }, coordinates_wh: { x: 156.08976364135742, y: 175.37527084350586 } }
        ]
      };
      const checkedLabels = compareLabelsPair(data.originalLabels, data.newLabels);
      assert.lengthOf(checkedLabels, 1, "length of checkedLabels > 0, it means there are new label");
    });

    it("new upload image with modified coordinates and scale", () => {
      const data = {
        newLabels: [
          { labelId: "inference_304", imageId: NaN, tag: "Person", x: 300, y: 150, width: 400, height: 490, scale: { X: 1, Y: 1 } },
          { labelId: "inference_305", imageId: NaN, tag: "Top", x: 325.09, y: 353.02, width: 389.44, height: 292.42, scale: { X: 1.1, Y: 1.1 } },
          { labelId: "inference_306", imageId: NaN, tag: "Hat", x: 448.76, y: 212.47, width: 156.09, height: 175.38, scale: { X: 1, Y: 1 } }
        ],
        originalLabels: [
          { id: "inference_304", imageId: NaN, labeler: "ai", owner: 1, tag: "Person", coordinates_xy: { x: 315.210018157959, y: 149.4214415550232 }, coordinates_wh: { x: 409.43262100219727, y: 492.96584129333496 } },
          { id: "inference_305", imageId: NaN, labeler: "ai", owner: 1, tag: "Top", coordinates_xy: { x: 325.09191513061523, y: 353.01705598831177 }, coordinates_wh: { x: 389.43986892700195, y: 292.4248695373535 } },
          { id: "inference_306", imageId: NaN, labeler: "ai", owner: 1, tag: "Hat", coordinates_xy: { x: 448.7643623352051, y: 212.47409582138062 }, coordinates_wh: { x: 156.08976364135742, y: 175.37527084350586 } }
        ]
      };
      const checkedLabels = compareLabelsPair(data.originalLabels, data.newLabels);
      assert.lengthOf(checkedLabels, 2, "length of checkedLabels > 0, it means there are new label");
    });

    it("reload image", () => {
      const data = {
        newLabels: [
          { labelId: "inference_242", imageId: 79, tag: "Boat", x: 145.52, y: 297.83, width: 127.18, height: 153.31, scale: { X: 1, Y: 1 } }
        ],
        originalLabels: [
          { id: "inference_242", imageId: 79, labeler: "ai", owner: 1, tag: "Boat", coordinates_xy: { x: 145.5221284031868, y: 297.82982632517815 }, coordinates_wh: { x: 127.18280214071274, y: 153.30593249201775 } }
        ]
      };
      const checkedLabels = compareLabelsPair(data.originalLabels, data.newLabels);
      assert.lengthOf(checkedLabels, 0, "length of checkedLabels > 0, it means there are new label");
    });

    it("reload only ai labeled image and add new label", () => {
      const data = {
        newLabels: [
          { labelId: "inference_242", imageId: 79, tag: "Boat", x: 145.52, y: 297.83, width: 127.18, height: 153.31, scale: { X: 1, Y: 1 } },
          { labelId: "fresh_0", imageId: 79, tag: "test", x: 391.5, y: 253, width: 79, height: 163, scale: { X: 1, Y: 1 } }
        ],
        originalLabels: [
          { id: "inference_242", imageId: 79, labeler: "ai", owner: 1, tag: "Boat", coordinates_xy: { x: 145.5221284031868, y: 297.82982632517815 }, coordinates_wh: { x: 127.18280214071274, y: 153.30593249201775 } }
        ]
      };
      const checkedLabels = compareLabelsPair(data.originalLabels, data.newLabels);
      assert.lengthOf(checkedLabels, 1, "length of checkedLabels > 0, it means there are new label");
    });

    it("reload user labeled image and add new label", () => {
      const data = {
        newLabels: [
          { labelId: 17, imageId: 49, tag: "mask", x: 373, y: 275, width: 346, height: 269, scale: { X: 1, Y: 1 } },
          { labelId: "fresh_0", imageId: 49, tag: "test", x: 374.5, y: 123, width: 184, height: 80, scale: { X: 1, Y: 1 } }
        ],
        originalLabels: [
          { id: 17, imageId: 49, labeler: 4, label_name: "james", owner: 1, tag: "mask", coordinates_xy: { x: 373, y: 275 }, coordinates_wh: { x: 346, y: 269 } }
        ]
      };
      const checkedLabels = compareLabelsPair(data.originalLabels, data.newLabels);
      assert.lengthOf(checkedLabels, 1, "length of checkedLabels > 0, it means there are new label");
    });
  });
});
