const imageRow = document.querySelector(".album .container .row");

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
      console.log(res);
      res.forEach(obj => {
        const imgHref = "html/label.html?id=" + obj.image_id;
        const imgPath = obj.image_path;
        const html = `
        <div class="col-4">
            <div class="card shadow-sm">
                <a class="image" href=${imgHref}>
                    <img src=${imgPath} width="100%" height="100%">
                </a>
            </div>
        </div>
        `;
        imageRow.innerHTML += html;
      });
    });
};
