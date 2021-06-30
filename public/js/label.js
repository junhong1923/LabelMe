/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const token = localStorage.getItem("token");
const boundingBtn = document.querySelector("#bounding");
const undo = [];
const redo = [];
const undoBtn = document.querySelector("#undo");
const redoBtn = document.querySelector("#redo");
let userId;
let userName;
let imageId;
let imageSrc;
let file;
const uploadImg = {};
let drawType;
let [lastX, lastY] = [0, 0];
const isOrigin = true;
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
      // console.log("取消拖拉移動整個畫布");
    } else { // 拖拉移動整個畫布
      currentMode = modes.pan;
      canvas.isDrawingMode = false;
      // console.log("拖拉移動整個畫布");
    }
  } else if (mode === modes.drawing) { // draw line
    if (currentMode === modes.drawing) { // 取消畫畫模式
      currentMode = "";
      canvas.isDrawingMode = false;
      e.parentNode.parentNode.previousElementSibling.className = "btn btn-secondary dropdown-toggle";
    } else { // 畫畫模式
      canvas.freeDrawingBrush.color = "red";
      canvas.freeDrawingBrush.width = 3;
      currentMode = modes.drawing;
      canvas.isDrawingMode = true;
      e.parentNode.parentNode.previousElementSibling.className = "btn btn-secondary dropdown-toggle active";
    }
  } else if (mode === modes.bounding) {
    if (currentMode === modes.bounding) { // 取消拉框模式
      currentMode = "";
      canvas.isDrawingMode = false;
      canvas.getObjects().forEach(obj => { obj.selectable = true; });
    } else { // 拉框模式
      currentMode = modes.bounding;
      canvas.isDrawingMode = false;
      canvas.getObjects().forEach(obj => { obj.selectable = false; });
    }
  }
  // console.log(mode, currentMode);
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
    } else if (mousePressed && currentMode === modes.bounding) {
      canvas.setCursor("crosshair");
      canvas.renderAll();
    } else if (currentMode === modes.bounding) {
      canvas.setCursor("crosshair");
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
          hasRotatingPoint: false,
          selectable: false
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
      }
    }
  });

  canvas.on("mouse:down", (event) => {
    mousePressed = true;
    [lastX, lastY] = [event.pointer.x, event.pointer.y];
    // console.log("CurrentMode:", currentMode);
    if (currentMode === modes.pan) {
      canvas.setCursor("grab");
      canvas.renderAll();
    }

    canvasObjCount = canvas.getObjects().length;
  });

  canvas.on("mouse:up", (event) => {
    mousePressed = false;
    mouseClickId += 1;
    canvas.setCursor("default");
    canvas.renderAll();

    if (canvasObjCount !== canvas.getObjects().length) { // bug: label in bounding then it would not add in table
      // render the latest object to label table
      const latestObj = canvas.getObjects()[canvas.getObjects().length - 1];

      // bug: imgOwner目前從labels[0]取得，但如果圖還沒有任何標註，則擁有者是誰？要去哪抓？ sol:一開始回傳labels也要帶owner
      let imgOwner;
      if (labels === undefined) {
        imgOwner = userId;
        // console.log(imgOwner, labels);
      } else if (labels[0].owner) {
        imgOwner = labels[0].owner;
      }

      genLabelTable(imgOwner, userName, latestObj.labelId, latestObj.tag, "your", remove = true);
    }
  });
};

const clearCanvas = (canvas, state) => {
  canvas.getObjects().forEach((obj) => {
    if (obj !== canvas.backgroundImage) {
      canvas.remove(obj);
    }
  });
};

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

  file = inputFile.files[0];
  reader.readAsDataURL(file);
});

reader.addEventListener("load", () => { // Loading Image
  fabric.Image.fromURL(reader.result, img => {
    uploadImg.width = img.width;
    uploadImg.height = img.height;
    img.set({
      left: (canvas.width - img.width) / 2,
      top: (canvas.height - img.height) / 2,
      selectable: false
    });

    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
    canvas.requestRenderAll();

    // clean tags and labels in table list
    const tagsCount = tagsDiv.childElementCount;
    if (tagsCount > 1) {
      for (let i = 0; i < tagsCount - 1; i++) {
        tagsDiv.removeChild(tagsDiv.firstElementChild);
      }
      tableBody.innerHTML = "";
    }
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
  // verify token authentication
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
        Swal.fire(res.error);
        window.location.assign("/html/welcome.html");
      } else {
        userId = res.id;
        userName = res.name;

        // if image_id, image_path in url then render that image to canvas
        const url = new URL(location.href);
        imageId = url.searchParams.get("id");
        imageSrc = url.searchParams.get("src");
        if (imageSrc && imageId) {
          renderImageSrc(imageSrc);

          data = await getImageLabels(res.id, imageId);
          // console.log(data);
          labels = data.userLabel;
          const inference = data.apiLabel;

          if (inference !== undefined && inference.length > 0) {
            const transformArr = transformCoordinates(inference);
            labels = [...labels, ...transformArr];
          }

          if (labels !== undefined && !labels[0].msg) {
            renderImageLabels(labels, renderTags = true, userId);
          }

          activateLabelBtn(labels, inference);
          state = canvas.toJSON();
        }

        // Upload Original Image
        const uploadBtn = document.querySelector(".upload-btn");
        uploadBtn.onclick = (e) => {
          let timerInterval;
          Swal.fire({
            title: "Uploading and Processing ...",
            timer: 16000,
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading();
              timerInterval = setInterval(() => {
                const content = Swal.getHtmlContainer();
                if (content) {
                  const b = content.querySelector("b");
                  if (b) {
                    b.textContent = Swal.getTimerLeft();
                  }
                }
              }, 100);
            },
            willClose: () => {
              clearInterval(timerInterval);
            }
          });
        };
        const imgForm = document.querySelector(".form-img");
        imgForm.onsubmit = submitted.bind(imgForm);
      }
    });

  const profile = document.querySelector("#profile");
  profile.addEventListener("click", (e) => {
    fetch("/api/1.0/user/profile", {
      method: "GET",
      headers: { authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (res.status === 200) { return res.json(); }
      })
      .then((res) => {
        const date = new Date();
        const monthName = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep", "Oct.", "Nov.", "Dec."];
        Swal.fire({
          title: "User Profile",
          html: `
              <div class="profile">
                <div>Hi, ${res.data.name}</div>
                <div><img src="../images/icons/email.svg">: ${res.data.email}</div>
                <div><img src="../images/icons/file_upload.svg">: ${res.data.imgQty} images</div>
                <div><img src="../images/icons/equalizer.svg">: ${res.data.labelCount} times/${monthName[date.getMonth()]}</div>
                <div><img src="../images/icons/cloud_done.svg">: ${(res.data.capacity / 2000000).toFixed(2)} of 2 GB used</div>
              </div>
            `
        });
      });
  });
};

const submitted = (event) => {
  event.preventDefault();
  const FORM = document.forms.namedItem("uploadImage");
  const formData = new FormData(FORM);
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/1.0/image/upload");
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      if (JSON.parse(xhr.response).inference) {
        const inference = JSON.parse(xhr.response).inference;
        Swal.fire({
          toast: true,
          icon: "success",
          title: "Upload done!",
          position: "top-end",
          showConfirmButton: false,
          timer: 3500
        });
        if (!inference.errno) {
          renderApiLabels(inference);
        }
      }
    } else if (xhr.responseText === "LIMIT_FILE_SIZE") {
      Swal.fire("Sorry, your image size is over limited 2MB.");
    } else if (xhr.responseText === "Out of 2GB usage.") {
      Swal.fire("Sorry, " + xhr.responseText);
    }
  };
  xhr.send(formData);
};

const commitLabel = (canvas) => {
  canvasJSON = canvas.toJSON();

  const coordinates = [];
  canvasJSON.objects.forEach((arr, idx) => {
    const labelId = canvas.getObjects()[idx].labelId;
    const tag = canvas.getObjects()[idx].tag;
    const scale = { X: arr.scaleX, Y: arr.scaleY };
    coordinates.push({
      imageId: parseInt(imageId), type: "bounding", tag, labelId, x: arr.left, y: arr.top, width: arr.width, height: arr.height, scale
    });
  });
  // console.log({ before: labels, after: coordinates });

  fetch("/api/1.0/label/coordinates", {
    method: "POST",
    body: JSON.stringify({
      before: labels,
      after: coordinates
    }),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
  })
    .then((res) => {
      if (res.status === 200) {
        return res.json();
      } else if (res.status === 401) {
        Swal.fire("Please Login again.");
        return window.location.assign("/login.html");
      } else if (res.status === 500) {
        console.log("Server Internal Error...");
      }
    })
    .then((res) => {
      if (res) {
        if (res.labeler) {
          Swal.fire({
            toast: true,
            title: "Submit done.",
            icon: "success",
            position: "top-end",
            showConfirmButton: false,
            timer: 3500,
            didOpen: (toast) => {
              toast.addEventListener("mouseenter", Swal.stopTimer);
              toast.addEventListener("mouseleave", Swal.resumeTimer);
            }
          });
        } else if (res.msg === "Nothing new to submit") {
          Swal.fire({
            toast: true,
            title: "Submit done, no new label coordiantes.",
            icon: "info",
            position: "top-end",
            showConfirmButton: false,
            timer: 3500,
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
    uploadImg.width = img.width;
    uploadImg.height = img.height;
    const oImg = img.set({
      left: (canvas.width - img.width) / 2,
      top: (canvas.height - img.height) / 2,
      selectable: false
    });

    canvas.setBackgroundImage(oImg, canvas.renderAll.bind(canvas));
    canvas.renderAll();
  });
};

const getImageLabels = (userId, imageId) => {
  return new Promise((resolve, reject) => {
    fetch(`/api/1.0/label/coordinates?user=${userId}&img=${imageId}`, { method: "GET" })
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

const deleteLabel = (labelId) => {
  return new Promise((resolve, reject) => {
    fetch(`/api/1.0/label/coordinates/${labelId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${localStorage.getItem("token")}` }
    })
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

const transformCoordinates = (inference) => {
  const renderArr = [];

  inference.forEach(obj => {
    const id = `inference_${obj.id}`;
    const labeler = "ai";
    const imgOwner = userId;
    const inferenceTag = obj.name;
    const inferenceScore = obj.score;
    const inferenceCoordiantes = {
      left: obj.boundingPoly.normalizedVertices[0].x * uploadImg.width + (canvas.width - uploadImg.width) / 2,
      top: obj.boundingPoly.normalizedVertices[0].y * uploadImg.height + (canvas.height - uploadImg.height) / 2,
      width: (obj.boundingPoly.normalizedVertices[1].x - obj.boundingPoly.normalizedVertices[0].x) * uploadImg.width,
      height: (obj.boundingPoly.normalizedVertices[2].y - obj.boundingPoly.normalizedVertices[1].y) * uploadImg.height
    };
    renderArr.push({ id, image_id: parseInt(imageId), owner: imgOwner, labeler: labeler, tag: inferenceTag, score: inferenceScore, coordinates_xy: { x: inferenceCoordiantes.left, y: inferenceCoordiantes.top }, coordinates_wh: { x: inferenceCoordiantes.width, y: inferenceCoordiantes.height } });
  });
  return renderArr;
};

const renderApiLabels = (inference) => {
  // 一次整理好再render
  const renderInput = transformCoordinates(inference);
  labels = renderInput;
  renderImageLabels(renderInput, renderTags = true, userId);
};

const renderImageLabels = (labels, renderTags = true, userId) => {
  // variables for render label list table
  tableBody.innerHTML = "";

  const imgOwner = labels[0].owner;
  // get tag and color map
  const tagSet = new Set();
  labels.forEach(arr => { tagSet.add(arr.tag); });

  const tagColorMap = {};
  Array.from(tagSet).forEach(function (value, idx) {
    tagColorMap[value] = colorArr[idx];
  });

  // render tag using colorSet to avoid duplicate
  if (renderTags) {
    for (const key in tagColorMap) {
      LabelTagsDOM = genLabelTagsDOM(key, tagColorMap[key]);
      tagsDiv.insertBefore(LabelTagsDOM, addTagBtn);
    }
  }

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

    // ai inference doesn't have scale property, but user label need to add scale property
    if (!arr.id.toString().includes("inference")) {
      label.scaleX = arr.scale.x;
      label.scaleY = arr.scale.y;
    }

    const labelId = arr.id;
    const labeler = arr.labeler;
    const tag = arr.tag;

    label.labelId = labelId;
    label.tag = tag;
    canvas.add(label);

    // render label list table
    if (userId === labeler) {
      genLabelTable(imgOwner, arr.labeler_name, labelId, tag, "your", remove = true);
    } else if (labeler === "ai") {
      genLabelTable(imgOwner, labeler, labelId, tag, labeler, remove = true);
    } else {
      genLabelTable(imgOwner, arr.labeler_name, labelId, tag, `shared.${idx + 1}`);
    }
  });
};

const genLabelTable = (imgOwner, labeler, labelId, tag, rowValue, remove = false) => {
  let tempHtml;
  if (userId === imgOwner || remove === true) {
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

const activateLabelBtn = (labels, inference) => {
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
      <div class="label-display"><img class="active" src="../images/icons/Eye-Show.svg" alt="label-display" width="20px" height="20px"></div>
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
    canvas.getObjects().forEach(obj => { obj.selectable = false; });
  }

  // display or not
  if (e.target.alt === "label-display") {
    const clickedTagColor = e.target.parentNode.parentNode.firstElementChild.id;
    if (e.target.className === "active") {
      e.target.className = "";
      e.target.src = "../images/icons/Eye-Show-Disable.svg";
      canvas.getObjects().forEach(arr => {
        if (arr.stroke === clickedTagColor) {
          arr.opacity = 0;
          canvas.renderAll();
        }
      });
    } else {
      e.target.className = "active";
      e.target.src = "../images/icons/Eye-Show.svg";
      canvas.getObjects().forEach(arr => {
        if (arr.stroke === clickedTagColor) {
          arr.opacity = 1;
          canvas.renderAll();
        }
      });
    }
  }
};

// remove label, and cannot undo，但應該改成只有owner才能刪，其他人只能隱藏
tableBody.onclick = (e) => {
  let labelId;
  if (e.target.id.includes("inference")) {
    labelId = e.target.id;
  } else if (!e.target.id.includes("fresh")) {
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
        // remove obj on canvas
        canvas.getObjects().forEach(obj => {
          // ai inference labels are able to be deleted
          if (obj.labelId === labelId) {
            canvas.remove(obj);
          }
        });
        // remove label on table list
        for (let i = 0; i < tableBody.childElementCount; i++) {
          if (tableBody.children[i].id === labelId.toString()) {
            tableBody.removeChild(tableBody.children[i]);
          }
        }

        deleteLabel(labelId);

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

const saveFile = () => {
  const link = document.getElementById("download");
  let downloadFileName;

  if (file) {
    downloadFileName = `labeled_${file.name.split(".")[0]}.json`;
  } else {
    // get name of img url
    downloadFileName = `labeled_${imageSrc.split("/")[imageSrc.split("/").length - 1].split(".")[0]}.json`;
  }
  console.log(downloadFileName);

  // download labeled json file
  const blob = new Blob([JSON.stringify({ data: canvas.getObjects() })]);

  link.download = downloadFileName;
  link.href = URL.createObjectURL(blob);
  link.click();
  const currState = canvas.toJSON();
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

// 當 canvas 中的物件被修改時，先將之前的 state push 進入 undo 裡面，再把目前的 state 儲存起來
canvas.on("object:modified", e => {
  undo.push(state);
  state = JSON.stringify(canvas);
  redo.length = 0;
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

signout.onclick = () => {
  localStorage.removeItem("token");
  window.location.assign("/");
};
