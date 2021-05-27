/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const token = localStorage.getItem("token");
let imageId;
let imageSrc;
let file;
let drawType;
let [lastX, lastY] = [0, 0];
let isOrigin = true;

const DrawingColours = { BLACK: "rgba(0,0,0,1)", WHITE: "rgba(255,255,255,1)" };
const DEFAULT_OPACITY = 0.2;

const initCanvas = (id) => {
  return new fabric.Canvas(id, {
    backgroundColor: "white",
    selection: false
  });
};

const toggleMode = (e, mode) => {
  if (mode === modes.pan) {
    if (currentMode === modes.pan) { // 取消拖拉移動整個畫布
      currentMode = "";
      e.className = "btn btn-secondary";
      console.log("取消拖拉移動整個畫布");
    } else { // 拖拉移動整個畫布
      currentMode = modes.pan;
      canvas.isDrawingMode = false;
      // canvas.renderAll();
      e.className = "btn btn-secondary active";
      console.log("拖拉移動整個畫布");
    }
  } else if (mode === modes.drawing) { // draw line
    if (currentMode === modes.drawing) { // 取消畫畫模式
      currentMode = "";
      canvas.isDrawingMode = false;
      // canvas.renderAll();
      e.parentNode.parentNode.previousElementSibling.className = "btn btn-secondary dropdown-toggle";
    } else { // 畫畫模式
      canvas.freeDrawingBrush.color = "red";
      canvas.freeDrawingBrush.width = 3;
      currentMode = modes.drawing;
      canvas.isDrawingMode = true;
      // canvas.renderAll();
      e.parentNode.parentNode.previousElementSibling.className = "btn btn-secondary dropdown-toggle active";
    }
  } else if (mode === modes.bounding) {
    if (currentMode === modes.bounding) { // 取消拉框模式
      currentMode = "";
      canvas.isDrawingMode = false;
      // canvas.renderAll();
      e.parentNode.parentNode.previousElementSibling.className = "btn btn-secondary dropdown-toggle";
    } else { // 拉框模式
      // canvas.freeDrawingBrush.color = "";
      // canvas.freeDrawingBrush.width = 3;
      currentMode = modes.bounding;
      canvas.isDrawingMode = false;
      e.parentNode.parentNode.previousElementSibling.className = "btn btn-secondary dropdown-toggle active";
    }
  } else if (mode === modes.poly) {
    if (currentMode === modes.poly) { // 取消poly模式
      currentMode = "";
      canvas.isDrawingMode = false;
      // canvas.renderAll();
      e.parentNode.parentNode.previousElementSibling.className = "btn btn-secondary dropdown-toggle";
    } else { // poly模式
      canvas.freeDrawingBrush.color = "blue";
      canvas.freeDrawingBrush.width = 3;
      currentMode = modes.poly;
      canvas.isDrawingMode = true;
      e.parentNode.parentNode.previousElementSibling.className = "btn btn-secondary dropdown-toggle active";
    }
  }
  console.log(mode, currentMode);
};

const setPanEvents = (canvas) => {
  canvas.on("mouse:move", (event) => {
    if (mousePressed && currentMode === modes.pan) {
      canvas.setCursor("grab");
      canvas.renderAll();
      const mEvent = event.e;
      const delta = new fabric.Point(mEvent.movementX, mEvent.movementY);
      canvas.relativePan(delta);
    } else if (mousePressed && currentMode === modes.drawing) {
      // canvas.isDrawingMode = true;
      // canvas.renderAll();
    }

    if (mousePressed && currentMode === "bounding") {
      const rect = new fabric.Rect({
        left: event.pointer.x,
        top: event.pointer.y,
        strokeWidth: 2,
        stroke: "green", // DrawingColours
        // fill: this.setOpacity(DrawingColours.WHITE, DEFAULT_OPACITY),
        fill: "#00000000",
        width: 0,
        height: 0,
        hasRotatingPoint: false
      });
      rect.id = "myUUID"; // uuid();

      canvas.add(rect);

      rect.set({
        width: Math.abs(lastX - event.pointer.x),
        height: Math.abs(lastY - event.pointer.y)
      });
      rect.set({ left: Math.min(event.pointer.x, lastX) });
      rect.set({ top: Math.min(event.pointer.y, lastY) });
      rect.setCoords();

      for (let i = 0; i < canvas.getObjects().length; i++) {
        if (canvas.getObjects()[i]._element === undefined || canvas.getObjects()[i].stroke === "rgb(0, 0, 0)") {
          canvas.remove(canvas.getObjects()[i]);
        }
      }
      // console.log(canvas.getObjects()[canvas.getObjects().length - 1]);
    }
  });

  canvas.on("mouse:down", (event) => {
    mousePressed = true;
    [lastX, lastY] = [event.pointer.x, event.pointer.y];
    console.log(currentMode);
    if (currentMode === modes.pan) {
      canvas.setCursor("grab");
      canvas.renderAll();
    }
  });

  canvas.on("mouse:up", (event) => {
    mousePressed = false;
    canvas.setCursor("default");
    canvas.renderAll();
  });
};

const clearCanvas = (canvas, state) => {
  // state.val = canvas.toSVG();
  canvas.getObjects().forEach((obj) => {
    if (obj !== canvas.backgroundImage) {
      canvas.remove(obj);
    }
  });
};

// const restoreCanvas = (canvas, state) => {
//   if (state.val) {
//     canvas.clearCanvas();
//     fabric.loadSVGFromString(state.val, objects => {
//       console.log(objects);
//       canvas.add(...objects);
//       canvas.requestRenderAll();
//     });
//   }
// };

const groupObjects = (canvas, group, shouldGroup) => {
  if (shouldGroup) {
    const objects = canvas.getObjects();
    group.val = new fabric.Group(objects);
    clearCanvas(canvas);
    canvas.add(group.val);
    canvas.requestRenderAll();
  } else {
    if (group.val) {
      group.val.destroy();
      const oldGroup = group.val.getObjects();
      canvas.remove(group.val);
      canvas.add(...oldGroup);
      group.val = null;
      canvas.requestRenderAll();
    }
  }
};

const canvas = initCanvas("canvas");
// const svgState = {};
let mousePressed = false;
const group = {};

let currentMode;

const modes = {
  pan: "pan", // 拖拉移動畫布
  drawing: "drawing",
  bounding: "bounding",
  poly: "poly"
};

setPanEvents(canvas);

const inputFile = document.getElementById("myImg");
const reader = new FileReader();
const shareBtn = document.getElementById("share");

// render uploaded image to canvas
inputFile.addEventListener("change", (e) => {
  clearCanvas(canvas);
  // console.log(e);

  file = inputFile.files[0];
  reader.readAsDataURL(file);
});

reader.addEventListener("load", () => { // Loading Image
  fabric.Image.fromURL(reader.result, img => {
    img.set({
      left: (canvas.width - img.width) / 2,
      top: (canvas.height - img.height) / 2
    });
    canvas.add(img);
    canvas.requestRenderAll();
  });
});

shareBtn.addEventListener("click", (e) => {
  e.target.style.outline = "none";
  if (e.target.value === "private") {
    e.target.style.color = "white";
    e.target.style.backgroundColor = "#28a745";
    e.target.value = "share";
  } else {
    e.target.style.color = "#28a745";
    e.target.style.backgroundColor = "white";
    e.target.value = "private";
  }
});

window.onload = (e) => {
  // verify token authentication first
  fetch("/api/1.0/user/auth", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` }
  })
    .then((res) => {
      if (res.status === 200) {
        return res.json();
      } else {
        return res.json();
      }
    })
    .then(async (res) => {
      if (res.error) {
        alert(res.error);
        window.location.assign("/html/welcome.html");
      } else {
        // we have userId here: res.id
        console.log(res);

        // if image_id, image_path in url then render that image to canvas
        const url = new URL(location.href);
        imageId = url.searchParams.get("id");
        imageSrc = url.searchParams.get("src");
        if (imageSrc && imageId) {
          renderImageSrc(imageSrc);
          const labels = await getImageLabels(res.id, imageId);
          if (!labels.msg) {
            activateLabelBtn(labels);
            renderImageLabels(labels);
          }
        }

        // Upload Original Image
        const imgForm = document.querySelector(".form-img");
        imgForm.onsubmit = submitted.bind(imgForm);
      }
    });
};

const submitted = (event) => {
  event.preventDefault();
  const FORM = document.forms.namedItem("uploadImage");
  // 5/24 cannot get share value inside formData...
  // console.log(event.target.elements[1].value);
  const formData = new FormData(FORM);
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/1.0/label/ori-image");
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      console.log(xhr.response);
    }
  };
  xhr.send(formData);
};

const commitLabel = (canvas) => {
  // console.log(canvas.getObjects());
  // console.log(canvas.toDataURL("image/jpeg")); // base64
  // console.log(canvas.toJSON());
  canvasJSON = canvas.toJSON();

  let coordinates;
  canvasJSON.objects.forEach((arr) => {
    if (arr.type === "rect") {
      coordinates = { imageId: imageId, type: "bounding", x: arr.left, y: arr.top, width: arr.width, height: arr.height };
    }
  });

  fetch("/api/1.0/label/coordinates", {
    method: "POST",
    body: JSON.stringify(coordinates),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
  })
    .then((res) => {
      console.log("Response status: ", res.status);
      // 得到一個 ReadableStream 的物件
      if (res.status === 200) {
        return res.json();
      } else if (res.status === 401) {
        alert("Please Login.");
        return window.location.assign("/login.html");
      } else {
        return res.json();
      }
    })
    .then((res) => {
      console.log(res);
      if (res.error === "Cannot find your email account.") {
        alert(`${res.error}Please Signup`);
        window.location.assign("login.html");
      } else if (res.error === "Forbidden: TokenExpiredError") {
        alert(res.error);
        window.location.assign("login.html");
      }
    }).catch((err) => {
      console.log(err);
    });
};

const renderImageSrc = (url) => {
  fabric.Image.fromURL(url, (img) => {
    const oImg = img.set({
      left: (canvas.width - img.width) / 2,
      top: (canvas.height - img.height) / 2
    });
    canvas.add(oImg);
  });
};

const getImageLabels = (userId, imageId) => {
  return new Promise((resolve, reject) => {
    fetch(`/api/1.0/label/load-coordinates?user=${userId}&img=${imageId}`, { method: "GET" })
      .then((res) => {
        if (res.status === 200) {
          return res.json();
        }
      })
      .then((res) => {
        resolve(res);
      })
      .catch(err => reject(err));
  });
};

const renderImageLabels = (labels) => {
  console.log(labels);
  const XY = labels.coordinates_xy;
  const WH = labels.coordinates_wh;
  const label = new fabric.Rect({
    left: XY.x,
    top: XY.y,
    width: WH.x,
    height: WH.y,
    strokeWidth: 2,
    stroke: "green",
    fill: "transparent"
  });
  canvas.add(label);
};

const activateLabelBtn = (labels) => {
  const LabelBtn = document.getElementById("flexSwitchCheckChecked");
  LabelBtn.removeAttribute("disabled");

  LabelBtn.addEventListener("click", () => {
    if (canvas.getObjects().length === 1) {
      // if only have image, then render label
      renderImageLabels(labels);
    } else {
      canvas.getObjects().forEach(arr => {
        // if arrtibute stroke = green, then remove this bounding coordinates
        if (arr.stroke === "green") {
          canvas.remove(arr);
        }
      });
    }
  });
};

const saveFile = () => {
  const link = document.getElementById("download");
  // 5/26 如果是從主頁點近來開始的，會沒有file.name。可能要從url去切出檔名
  let downloadFileName;
  if (file) {
    downloadFileName = `labeled_${file.name}`;
  } else {
    // get name of img url
    downloadFileName = `labeled_${imageSrc.split("/")[imageSrc.split("/").length - 1]}`;
  }
  console.log(downloadFileName);
  link.download = downloadFileName;
  link.href = canvas.toDataURL("image/jpeg"); // Image format of the output
  link.click();
  const currState = canvas.toJSON();
  console.log("currState of saving:");
  console.log(currState);
};

const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const showZoom = document.getElementById("zoom");

const center = canvas.getCenter();
function setZoom (zoom, point = { x: center.left, y: center.top }) {
  // zoom 為 +-0.1
  const newZoom = canvas.getZoom() + zoom;
  canvas.zoomToPoint(point, newZoom);
  // showZoom 為 input element
  showZoom.value = `${Math.round(newZoom * 100)}%`;
}

zoomInBtn.addEventListener("click", () => setZoom(0.1));
zoomOutBtn.addEventListener("click", () => setZoom(-0.1));
canvas.on("mouse:wheel", (event) => {
  const deltaY = event.e.deltaY;
  const newZoom = deltaY / 1000;
  setZoom(newZoom, { x: event.e.offsetX, y: event.e.offsetY });
});

// 5/17
const invertColor = () => {
  // 抓出像素 (canvas 面對本機的影像檔案，會因為安全性的考量，不讓程式去取得圖片中的像素資料，就無法做濾鏡的處理。)
  const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height); // ImageData 物件
  const data = pixels.data; // 存放所有像素資訊的陣列。 一個像素佔據4個資料(bytes) -> r,g,b,alpha (範圍0~255)
  const tempData = data;
  if (isOrigin) {
    console.log(1);
    for (let i = 0; i < data.length; i += 4) {
      // data[i] = 255 - data[i]; // red
      // data[i + 1] = 255 - data[i + 1]; // green
      // data[i + 2] = 255 - data[i + 2]; // blue

      const arg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      tempData[i] = arg;
      tempData[i + 1] = arg;
      tempData[i + 2] = arg;
      isOrigin = false;

    //   pixels.data = tempData;
    }
  } else {
    console.log(2);
    console.log(data === tempData);
    isOrigin = true;
    pixels.data = data;
  }

  canvas.getContext("2d").putImageData(pixels, 0, 0);
};

// const canvas = this.$refs.drawCanvas;
// // 將 canvas 傳入
// const fabricCanvas = new fabric.Canvas(canvas);
// // 從 url 讀取圖片
// fabric.Image.fromURL(img2, img => {
//   const oImg = img.set({
//     // 這邊可以設定上下左右距離、角度、寬高等等
//     left: 0
//     // top: 100
//     // angle: 15,
//     // width: 500,
//     // height: 500
//   });
//   // 將圖片縮放到寬高
//   oImg.scaleToWidth(cw);
//   oImg.scaleToHeight(ch);
//   // 記得要加進入才會顯示
//   fabricCanvas.add(oImg);
//   // 使用亮度濾鏡
//   const filter = new fabric.Image.filters.Brightness({
//     brightness: 0.5
//   });
//   oImg.filters.push(filter);
//   oImg.applyFilters();
// });

// const circle = new fabric.Circle({
//   radius: 80, fill: "green", left: 100, top: 100
// });
// const triangle = new fabric.Triangle({
//   width: 120, height: 180, fill: "blue", left: 300, top: 200
// });
// const editText = new fabric.IText("雙擊我編輯", {
//   top: 400,
//   left: 400
// });
// fabricCanvas.add(circle, triangle, editText);
