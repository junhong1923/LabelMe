/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const token = localStorage.getItem("token");
const boundingBtn = document.querySelector("#bounding");
const undo = [];
const redo = [];
const undoBtn = document.querySelector("#undo");
const redoBtn = document.querySelector("#redo");
let userId;
let imageId;
let imageSrc;
let file;
let drawType;
let [lastX, lastY] = [0, 0];
let isOrigin = true;
const signout = document.querySelector("#signout");
let labels;
const colorArr = ["green", "rgba(31,119,180,1)", "rgba(214,39,40,1)", "rgba(148,103,189,1)", "rgba(23,190,207,1)", "rgb(128,0,128,1)", "coral", "hotpink", "rgba(140,86,75,1)", "rgba(255,152,150,1)"];
const tagsDiv = document.querySelector("#tags");
let selectedTag;
let tagColor;
const addTagBtn = document.querySelector(".canvas .label-pane .add-btn");
const tableBody = document.querySelector(".canvas .table tbody");
let canvasObjCount = 0;

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
      console.log("取消拖拉移動整個畫布");
    } else { // 拖拉移動整個畫布
      currentMode = modes.pan;
      canvas.isDrawingMode = false;
      // canvas.renderAll();
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
      canvas.getObjects().forEach(obj => { obj.selectable = true; });
    } else { // 拉框模式
      // canvas.freeDrawingBrush.color = "green";
      // canvas.freeDrawingBrush.width = 3;
      currentMode = modes.bounding;
      canvas.isDrawingMode = false;
      canvas.getObjects().forEach(obj => { obj.selectable = false; });
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
    } else if (mousePressed && currentMode === modes.bounding) {
      canvas.setCursor("crosshair");
      canvas.renderAll();
    } else if (currentMode === modes.bounding) {
      canvas.setCursor("crosshair");
      // maybe 加入十字座標虛線？
      canvas.renderAll();
    }

    if (mousePressed && currentMode === "bounding") {
      if (!(selectedTag && tagColor)) {
        Swal.fire({
          title: "Please Create or Select a tag.",
          text: "See right side bar there.",
          icon: "info"
        });
      } else {
        state = canvas.toJSON();
        undo.push(state);
        const rect = new fabric.Rect({
          left: event.pointer.x,
          top: event.pointer.y,
          strokeWidth: 2,
          stroke: tagColor,
          fill: "#00000000",
          width: 0,
          height: 0,
          hasRotatingPoint: false
        });
        rect.labelId = "fresh_" + mouseClickId;
        rect.tag = selectedTag;
        canvas.add(rect);

        rect.set({
          width: Math.abs(lastX - event.pointer.x),
          height: Math.abs(lastY - event.pointer.y)
        });
        rect.set({ left: Math.min(event.pointer.x, lastX) });
        rect.set({ top: Math.min(event.pointer.y, lastY) });
        rect.setCoords();

        for (let i = 0; i < canvas.getObjects().length - 1; i++) {
          if (canvas.getObjects()[i].labelId === `fresh_${mouseClickId}` && canvas.getObjects()[i].stroke === tagColor) {
            canvas.remove(canvas.getObjects()[i]);
          }
        }
        canvas.renderAll();
        // canvas.fire("object:modified");
        // state = canvas.toJSON();
        // undo.push(state);
      }
    }
  });

  canvas.on("mouse:down", (event) => {
    // console.log(event.target); // type
    mousePressed = true;
    [lastX, lastY] = [event.pointer.x, event.pointer.y];
    console.log("CurrentMode:", currentMode);
    if (currentMode === modes.pan) {
      canvas.setCursor("grab");
      canvas.renderAll();
    }
    // canvas.renderAll();
    // state = canvas.toJSON();
    canvasObjCount = canvas.getObjects().length;
  });

  canvas.on("mouse:up", (event) => {
    mousePressed = false;
    mouseClickId += 1;
    canvas.setCursor("default");
    canvas.renderAll();
    // state = canvas.toJSON();

    if (canvasObjCount !== canvas.getObjects().length) {
      // render the latest object to label table
      const latestObj = canvas.getObjects()[canvas.getObjects().length - 1];
      console.log(canvas.getObjects()[canvas.getObjects().length - 1]);

      const labelOwner = labels[0] ? labels[0].owner : userId; // if no owner in labels, then assign current userId
      genLabelTable(labelOwner, "labeler", latestObj.labelId, latestObj.tag, "your1", remove = true);
    }
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
canvas.hoverCursor = "pointer";
// const svgState = {};
let mousePressed = false;
let mouseClickId = 0;
const group = {};
let state = canvas.toJSON();
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
      top: (canvas.height - img.height) / 2,
      selectable: false
    });
    // canvas.add(img);
    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
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
        // alert(res.error);
        Swal.fire(res.error);
        window.location.assign("/html/welcome.html");
      } else {
        // we have userId here: res.id
        userId = res.id;
        console.log(res);

        // if image_id, image_path in url then render that image to canvas
        const url = new URL(location.href);
        imageId = url.searchParams.get("id");
        imageSrc = url.searchParams.get("src");
        if (imageSrc && imageId) {
          renderImageSrc(imageSrc);
          labels = await getImageLabels(res.id, imageId);
          if (!labels.msg) {
            activateLabelBtn(labels);
            renderImageLabels(labels, renderTags = true, userId);
            state = canvas.toJSON();
          }
        }

        // Upload Original Image
        const uploadBtn = document.querySelector(".upload-btn");
        uploadBtn.onclick = (e) => {
          Swal.fire({
            toast: true,
            icon: "success",
            title: "Uploading",
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
          });
        };
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
  // console.log(canvas.toDataURL("image/jpeg")); // base64
  canvasJSON = canvas.toJSON();

  const coordinates = [];
  canvasJSON.objects.forEach((arr, idx) => {
    const labelId = canvas.getObjects()[idx].labelId;
    const tag = canvas.getObjects()[idx].tag;
    const scale = { X: arr.scaleX, Y: arr.scaleY };
    coordinates.push({
      imageId: parseInt(imageId), type: "bounding", tag, labelId, x: arr.left, y: arr.top, width: arr.width * scale.X, height: arr.height * scale.Y, scale
    });
  });
  console.log(coordinates);
  fetch("/api/1.0/label/coordinates", {
    method: "POST",
    body: JSON.stringify({
      before: labels,
      after: coordinates
    }),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
  })
    .then((res) => {
      console.log("Response status: ", res.status);
      // 得到一個 ReadableStream 的物件
      if (res.status === 200) {
        return res.json();
      } else if (res.status === 401) {
        // alert("Please Login.");
        Swal.fire("Please Login.");
        return window.location.assign("/login.html");
      } else {
        return res.json();
      }
    })
    .then((res) => {
      console.log(res);
      if (res.error === "Cannot find your email account.") {
        // alert(`${res.error}Please Signup`);
        Swal.fire(`${res.error}Please Signup`);
        window.location.assign("login.html");
      } else if (res.error === "Forbidden: TokenExpiredError") {
        // alert(res.error);
        Swal.fire(res.error);
        window.location.assign("login.html");
      } else {
        if (res.msg === "Nothing new to submit") {
          Swal.fire({
            toast: true,
            title: "Submit done, no new label coordiantes.",
            icon: "info",
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            didOpen: (toast) => {
              toast.addEventListener("mouseenter", Swal.stopTimer);
              toast.addEventListener("mouseleave", Swal.resumeTimer);
            }
          });
        } else {
          Swal.fire({
            toast: true,
            title: "Submit done.",
            icon: "success",
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            didOpen: (toast) => {
              toast.addEventListener("mouseenter", Swal.stopTimer);
              toast.addEventListener("mouseleave", Swal.resumeTimer);
            }
          });
        }
      }
    }).catch((err) => {
      console.log(err);
    });
};

const renderImageSrc = (url) => {
  fabric.Image.fromURL(url, (img) => {
    const oImg = img.set({
      left: (canvas.width - img.width) / 2,
      top: (canvas.height - img.height) / 2,
      selectable: false
    });

    // set background, then would not be clear as other labels
    canvas.setBackgroundImage(oImg, canvas.renderAll.bind(canvas));
    canvas.renderAll();
  });
  // 3rd param: , { crossOrigin: "Anonymous" }
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

const delDbLabel = (imageId, userId, labelId) => {
  return new Promise((resolve, reject) => {
    fetch(`/api/1.0/label/load-coordinates?img=${imageId}&user=${userId}&labelId=${labelId}`, { method: "" })
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

const renderImageLabels = (labels, renderTags = true, userId) => {
  // variables for render label list table
  tableBody.innerHTML = "";

  console.log(labels);
  const imgOwner = labels[0].owner;
  // 6/2 get tag and color map
  const tagSet = new Set();
  labels.forEach(arr => { tagSet.add(arr.tag); });

  const tagColorMap = {};
  Array.from(tagSet).forEach(function (value, idx) {
    tagColorMap[value] = colorArr[idx];
  });

  // using tag and color map to render labels
  labels.forEach((arr, idx) => {
    const XY = arr.coordinates_xy;
    const WH = arr.coordinates_wh;
    const label = new fabric.Rect({
      left: XY.x,
      top: XY.y,
      width: WH.x,
      height: WH.y,
      strokeWidth: 2,
      stroke: tagColorMap[arr.tag],
      fill: "transparent"
    });
    label.labelId = arr.id;
    label.tag = arr.tag;
    canvas.add(label);

    // render Tags inside Labels
    if (renderTags) {
      LabelTagsDOM = genLabelTagsDOM(arr.tag, tagColorMap[arr.tag]);
      tagsDiv.insertBefore(LabelTagsDOM, addTagBtn);
    }

    // render label list table
    const labelId = arr.id;
    const labeler = arr.labeler;
    const tag = arr.tag;

    genLabelTable(imgOwner, labeler, labelId, tag, `shared${idx + 1}`);
  });

  // remove label, and cannot undo，但應該改成只有owner才能刪，其他人只能隱藏
  tableBody.onclick = (e) => {
    console.log(e.target);
    let labelId;
    if (!e.target.id.includes("fresh")) {
      labelId = parseInt(e.target.id);
    } else {
      labelId = e.target.id;
    }

    if (e.target.alt === "remove") {
      Swal.fire({
        title: "Are you sure?",
        text: "Delete this label.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!"
      }).then((result) => {
        if (result.isConfirmed) {
          console.log("tableBody onclick, delete label...");

          // remove obj on canvas
          canvas.getObjects().forEach(obj => {
            if (obj.labelId === labelId) {
              canvas.remove(obj);
            }
          });
          // remove label on table list
          for (let i = 0; i < tableBody.childElementCount; i++) {
            if (tableBody.children[i].id === labelId) {
              tableBody.removeChild(tableBody.children[i]);
            }
          }

          // 這邊再發一隻api到後端資料庫刪除
          // delDbLabel(imageId, userId, labelId)

          Swal.fire("Delete!", "This label has been deleted.", "success");
        }
      });
    } else if (e.target.alt === "display") {
      if (e.target.className === "active") {
        canvas.getObjects().forEach(obj => {
          if (obj.labelId === labelId) {
            obj.opacity = 0;
            canvas.renderAll();
          }
        });
        e.target.className = "";
        e.target.src = "../images/icons/Eye-Show-Disable.svg";
      } else {
        canvas.getObjects().forEach(obj => {
          if (obj.labelId === labelId) {
            obj.opacity = 1;
            canvas.renderAll();
          }
        });
        e.target.className = "active";
        e.target.src = "../images/icons/Eye-Show.svg";
      }
    }
  };
};

const genLabelTable = (imgOwner, labeler, labelId, tag, rowValue, remove = false) => {
  let tempHtml;
  if (userId === imgOwner || remove) {
    tempHtml = `<td><img id=${labelId} src="../images/icons/trash.svg" alt="remove" width="25px" height="25px"></td>`;
  } else {
    tempHtml = `<td><img id=${labelId} src="../images/icons/block.svg" alt="forbidden" width="25px" height="25px"></td>`;
  }

  tableBody.innerHTML += `
    <tr id=${labelId}>
      <th scope="row">${rowValue}</th>
      <td>${tag}</td>
      <td>${labeler}</td>
      <td><img id=${labelId} class="active" src="../images/icons/Eye-Show.svg" alt="display" width="25px" height="25px"></td>
      ${tempHtml}
    </tr>
  `;
};

const activateLabelBtn = (labels) => {
  const LabelBtn = document.getElementById("flexSwitchCheckChecked");
  LabelBtn.removeAttribute("disabled");

  LabelBtn.addEventListener("click", () => {
    if (canvas.getObjects().length === 0) {
      // if only have image, then render label
      renderImageLabels(labels, renderTags = false, userId);
    } else {
      canvas.getObjects().forEach(arr => {
        canvas.remove(arr);
      });
    }
  });
};

addTagBtn.onclick = async (e) => {
  const tagsArr = [];
  for (let i = 0; i < e.target.parentNode.childElementCount - 1; i++) {
    tagsArr.push(e.target.parentNode.children[i].children[1].textContent.toLowerCase());
  }

  const { value: tagName } = await Swal.fire({
    title: "Tag Name",
    text: "Type the name of tage",
    input: "text",
    inputPlaceholder: "If the label target is 'face', then name tag 'face",
    showCancelButton: true,
    inputValidator: (value) => {
      if (!value) {
        return "Tag name is needed!";
      }
      if (tagsArr.includes(value.toLowerCase())) {
        return `${value} already existed.`;
      }
    }
  });

  if (tagName) {
    let underLimit = true;
    let color;
    if (addTagBtn.parentNode.childElementCount - 1 < 10) {
      color = colorArr[addTagBtn.parentNode.childElementCount - 1];
    } else {
      underLimit = false;
      Swal.fire({
        icon: "warning",
        title: "Limited...",
        text: "Ten tags are the limit."
      });
    }

    if (underLimit) {
      newTag = genLabelTagsDOM(tagName, color);
      tagsDiv.insertBefore(newTag, addTagBtn);
    }
  }
};

const genLabelTagsDOM = (tagName, color) => {
  const newTag = document.createElement("div");
  newTag.className = "label-btn";
  newTag.setAttribute("title", tagName);
  newTag.setAttribute("data-id", tagName);
  const tagHtml = `
      <div id="${color}" class="label-color">
        <svg width="16px" height="16px">
          <rect x="0" y="0" width="16" height="16" stroke="grey" fill=${color}></rect>
        </svg>
      </div>
      <div class="label-title">${tagName}</div>
      <div class="label-display"><img src="../images/icons/Eye-Show.svg" alt="label-display" width="20px" height="20px"></div>
  `;
  newTag.innerHTML = tagHtml;
  return newTag;
};

tagsDiv.onclick = (e) => {
  if (e.target.className === "label-title") {
    for (let i = 0; i < e.target.parentNode.parentNode.childElementCount - 1; i++) {
      e.target.parentNode.parentNode.children[i].className = "label-btn";
    }

    e.target.parentNode.className += " selected";
    selectedTag = e.target.textContent;
    tagColor = e.target.previousElementSibling.id;

    // auto change mode to bounding when tag selected
    currentMode = "bounding";
  }

  // display or not
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
// const zoomFitBtn = document.getElementById("zoomFitBtn");
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
// canvas.on("mouse:wheel", (event) => {
//   const deltaY = event.e.deltaY;
//   const newZoom = deltaY / 1000;
//   setZoom(newZoom, { x: event.e.offsetX, y: event.e.offsetY });
// });

// zoomFitBtn.onclick = () => {
//   canvas.zoomToPoint({ x: canvas.width, y: canvas.height }, 1);
// };

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

// 當 canvas 中的物件被修改時，先將之前的 state push 進入 undo 裡面，再把目前的 state 儲存起來
canvas.on("object:modified", e => {
  undo.push(state);
  state = JSON.stringify(canvas);
  redo.length = 0;
  console.log("modified");
});

// 把最後一筆被修改的內容透過 pop 拿出來讀取，再將 state 更改為上一步的狀態。
function doUndo () {
  if (!undo.length) {
    // alert("目前沒有動作可復原");
    Swal.fire("No movement to undo.");
    return;
  }
  const lastJSON = undo.pop();
  canvas.loadFromJSON(lastJSON);
  // 在做上一步時把目前狀態 push 到 redo 陣列
  redo.push(state);
  state = lastJSON;
}

function doRedo () {
  if (!redo.length) {
    // alert("目前沒有動作可復原");
    Swal.fire("No movement to redo.");
    return;
  }
  const lastJSON = redo.pop();
  canvas.loadFromJSON(lastJSON);
  // 在做下一步時把目前狀態 push 到 undo 陣列
  undo.push(state);
  state = lastJSON;
}

undoBtn.addEventListener("click", doUndo);
redoBtn.addEventListener("click", doRedo);

let hoverTag;
let hoverLabelId;
canvas.on("mouse:over", (e) => {
  // show tag on box when hover that box
  if (mousePressed === false && e.target) {
    hoverTag = e.target.tag;
    hoverLabelId = e.target.labelId;
    const xy = { left: e.target.left, top: e.target.top };
    console.log(hoverTag, hoverLabelId);
    const text = new fabric.Text(hoverTag, {
      left: xy.left + e.target.width / 2 - 15,
      top: xy.top,
      fontFamily: "helvetica",
      fontSize: 20,
      fill: "white",
      backgroundColor: "rgba(0,0,0,0.8)"
    });
    canvas.add(text);
    canvas.renderAll();

    // highlight the corresponded table list when its label hoverd
    for (let i = 0; i <= tableBody.childElementCount - 1; i++) {
      if (tableBody.children[i].id === hoverLabelId) {
        console.log(tableBody.children[i]);
        tableBody.children[i].style.backgroundColor = "rgba(0, 0, 0, 0.075)";
      }
    }
  }
});

canvas.on("mouse:out", (e) => {
  // clean tag text of box when mouse:out
  canvas.getObjects().forEach(arr => {
    if (arr.text) {
      canvas.remove(arr);
    }
  });
  canvas.renderAll();

  // clean the highlight background color of table list when mouse:out
  for (let i = 0; i <= tableBody.childElementCount - 1; i++) {
    if (tableBody.children[i].id === hoverLabelId) {
      tableBody.children[i].style.backgroundColor = "";
    }
  }
});

// get selected canvas object
// canvas.on("selection:created", (e) => {
//   console.log(e.target);
// });

signout.onclick = () => {
  localStorage.removeItem("token");
  window.location.assign("/");
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
