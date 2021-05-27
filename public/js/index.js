const imageRow = document.querySelector(".album .container .row");
const imagesBox = document.querySelector(".pictures");

window.onload = (e) => {
  const token = localStorage.getItem("token");
  fetch("/api/1.0/images/public?tag=0", {
    method: "GET"
  })
    .then((res) => {
      if (res.status === 200) {
        return res.json();
      } else { console.log(res.status); }
    })
    .then((res) => {
      res.forEach(obj => {
        const imgHref = `html/label.html?id=${obj.image_id}&src=${obj.image_path}`;
        const imgPath = obj.image_path;
        // const html = `
        // <div class="col-4">
        //     <div class="card shadow-sm">
        //         <a class="image" href=${imgHref}>
        //             <img src=${imgPath} width="100%" height="100%">
        //         </a>
        //         <p>Tag: ${obj.tag}</p>
        //     </div>
        // </div>
        // `;
        // imageRow.innerHTML += html;

        // using css only
        const html = `
        <div class="picture">
            <p>Tag: ${obj.tag}</p>
            <div class="imageContainer">
                <a class="image" href=${imgHref}>
                    <img src=${imgPath} alt="">
                </a>
            </div>
            <p>Download Image: <a target="_blank" href=${imgPath}>Click Here</a></p>
        </div>
        `;
        imagesBox.innerHTML += html;
      });
    });
};
