const imageRow = document.querySelector(".album .container .row");
const filterTab = document.querySelector("#myTab");
const selectedTabContent = document.querySelector("#myTabContent");
let userId;
const signout = document.querySelector("#signout");

const getImageData = (type, userId, status) => {
  let url;
  if (userId) {
    if (status !== undefined) {
      url = `/api/1.0/images/${type}?status=${status}&userid=${userId}`;
    } else {
      url = `/api/1.0/images/${type}?userid=${userId}`;
    }
  } else {
    url = `/api/1.0/images/${type}?status=${status}`;
  }
  fetch(url, {
    method: "GET"
  })
    .then((res) => {
      if (res.status === 200) {
        return res.json();
      } else { console.log(res.status); }
    })
    .then((res) => {
      console.log(res);
      if (!res.error) {
        imageRow.innerHTML = "";

        if (type === "private") {
          // sideBar
          imageRow.innerHTML = `
            <div class="folder" id="target-container" data-role="drag-drop-container">
              <ul class="list-unstyled ps-0">
                <a href="/" class="d-flex align-items-center pb-3 mb-3 link-dark text-decoration-none border-bottom">
                  <img src="../images/member.png" alt="mdo" width="32" height="32" class="rounded-circle"/>
                  <span class="fs-5 fw-semibold">My Data</span>
                </a>
                <li class="mb-1">
                  <button id="createFolder" class="btn btn-toggle align-items-center rounded collapsed">+ Create Folder</button>
                </li>
              </ul>
            </div>

            <div class="row images" data-role="drag-drop-container"></div>        
          `;

          // eventlistener for create folder btn
          const createFolderBtn = document.querySelector("#createFolder");
          createFolderBtn.onclick = async (e) => {
            const folder = document.createElement("button");

            const { value: folderName } = await Swal.fire({
              title: "Create Folder",
              inputLabel: "Type your folder name.",
              input: "text",
              inputPlaceholder: "Data_set_1",
              showCancelButton: true
            });

            folder.className = "btn btn-toggle align-items-center rounded collapsed";
            folder.textContent = folderName;

            e.target.parentNode.insertBefore(folder, createFolderBtn);
          };

          // render images into div
          const privateImageRow = document.querySelector(".album .row .images");
          res.forEach(obj => {
            const imgHref = `html/label.html?id=${obj.image_id}&src=${obj.image_path}`;
            const imgPath = obj.image_path;
            // const labelStatus = obj.status ? "labeled" : "unlabeled";
            const html = `
                <div id="img-${obj.image_id}" class="col-4" draggable="true">
                    <div class="card shadow-sm">
                        <a class="image" href=${imgHref}>
                            <img src=${imgPath} width="100%" height="100%" >
                        </a>
                        <p>Tag: ${obj.tag}</p>
                    </div>
                </div>
                `;
            privateImageRow.innerHTML += html;
          });

          // EventListener for dragSource: Allow multiple draggable items
          const dragSources = document.querySelectorAll("[draggable='true']");
          dragSources.forEach(dragSource => {
            dragSource.addEventListener("dragstart", dragStart);
          });
          // EventListener for dragContainer: Allow multiple dropped targets
          const dropTargets = document.querySelectorAll("[data-role='drag-drop-container']");
          dropTargets.forEach(dropTarget => {
            dropTarget.addEventListener("drop", dropped);
            dropTarget.addEventListener("dragenter", cancelDefault);
            dropTarget.addEventListener("dragover", cancelDefault);
          });
        } else {
          res.forEach(obj => {
            const imgHref = `html/label.html?id=${obj.image_id}&src=${obj.image_path}`;
            const imgPath = obj.image_path;
            // const labelStatus = obj.status ? "labeled" : "unlabeled";
            const html = `
                <div class="col-4">
                    <div class="card shadow-sm">
                        <a class="image" href=${imgHref}>
                            <img src=${imgPath} width="100%" height="100%">
                        </a>
                        <p><strong>Tag: ${obj.tag}</strong></p>
                    </div>
                </div>
                `;
            imageRow.innerHTML += html;

            // using css only
            // const html = `
            // <div class="picture">
            //     <p>Tag: ${obj.tag}</p>
            //     <div class="imageContainer">
            //         <a class="image" href=${imgHref}>
            //             <img src=${imgPath} alt="">
            //         </a>
            //     </div>
            //     <p>Download Image: <a target="_blank" href=${imgPath}>Click Here</a></p>
            // </div>
            // `;
            // imagesBox.innerHTML += html;
          });
        }
      } else {
        imageRow.innerHTML = "Labeled Image Not Found, try label images now!";
      }
    });
};

window.onload = (e) => {
  // get initial public image data
  getImageData("public");

  // listen to filterTab, and get different image data
  filterTab.addEventListener("click", (e) => {
    const filterType = e.target.textContent.toLowerCase();
    if (filterType === "private") {
      const token = localStorage.getItem("token");
      fetch("/api/1.0/user/auth", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` }
      })
        .then((res) => { return res.json(); })
        .then((res) => {
          if (res.error) {
            imageRow.innerHTML = "";
            Swal.fire("Login to see private images.");
            // disable filter tab btn

            console.log(res);
          } else {
            userId = res.id;
            getImageData(filterType, userId);
          }
        });
    } else if (filterType === "public") {
      getImageData("public");
    }
  });

  selectedTabContent.addEventListener("click", (e) => {
    if (e.target.type === "button") {
    //   console.log(e.target.parentNode.id);

      for (let i = 0; i < e.target.parentNode.children.length; i++) {
        if (e.target.parentNode.children[i].className.includes("active")) {
          e.target.parentNode.children[i].className = "btn btn-outline-dark";
        }
      }
      e.target.className += " active";

      // change image data by selected filter
      if (e.target.parentNode.id === "private") {
        if (e.target.innerHTML === "All") {
          getImageData("private", userId);
        } else if (e.target.innerHTML === "Labeled") {
          getImageData("private", userId, 1);
        } else if (e.target.innerHTML === "Unlabeled") {
          getImageData("private", userId, 0);
        }
      } else {
        if (e.target.innerHTML === "All") {
          getImageData("public");
        } else if (e.target.innerHTML === "Labeled") {
          getImageData("public", null, 1);
        } else if (e.target.innerHTML === "Unlabeled") {
          getImageData("public", null, 0);
        }
      }
    }
  });
};

const dragStart = (e) => {
  console.log("dragStart");
  console.log(e.target.id);
  e.dataTransfer.setData("text/plain", e.target.id);
};

const dropped = (e) => {
  console.log("dropped");
  cancelDefault(e);
  const id = e.dataTransfer.getData("text/plain");
//   e.target.appendChild(document.querySelector("#" + id));
  // 5/31 maybe call backend api to store imgId into particular folder
};

const cancelDefault = (e) => {
  e.preventDefault();
  e.stopPropagation();
  return false;
};

signout.onclick = () => {
  localStorage.removeItem("token");
  window.location.assign("/");
};
