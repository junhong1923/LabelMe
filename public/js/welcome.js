const loginForm = document.querySelector("form.login");
const signupForm = document.querySelector("form.signup");
const loginBtn = document.querySelector("label.login");
const signupBtn = document.querySelector("label.signup");
const signupLink = document.querySelector(".signup-link a");
const loginText = document.querySelector(".title-text .login");

signupBtn.onclick = () => {
  loginForm.style.marginLeft = "-50%";
  loginText.style.marginLeft = "-50%";
};
loginBtn.onclick = () => {
  loginForm.style.marginLeft = "0%";
  loginText.style.marginLeft = "0%";
};
signupLink.onclick = () => {
  signupBtn.click();
  return false;
};

loginForm.onsubmit = (e) => {
  e.preventDefault();

  const data = {
    provider: "native",
    name: e.target.elements[0].value,
    email: e.target.elements[1].value,
    password: e.target.elements[2].value
  };

  fetch("/api/1.0/user/signin", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  })
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else if (response.status === 403) {
        return response.json();
      }
    })
    .then((jsonData) => {
      if (jsonData.data) {
        localStorage.setItem("token", jsonData.data.access_token);
        window.location.assign("/");
      } else {
        Swal.fire({
          icon: "error",
          text: jsonData.error
        });
      }
    }).catch((err) => { console.log(err); });
};

signupForm.onsubmit = (e) => {
  e.preventDefault();

  if (!e.target.elements[1].value.includes("@")) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Wrong Email."
    });
  } else if (e.target.elements[2].value !== e.target.elements[3].value) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Password is not the same."
    });
  } else {
    const data = {
      provider: "native",
      name: e.target.elements[0].value,
      email: e.target.elements[1].value,
      password: e.target.elements[2].value
    };

    fetch("/api/1.0/user/signup", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    })
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else if (response.status === 400 || response.status === 403) {
          return response.json();
        }
      })
      .then((jsonData) => {
        if (jsonData.data) {
          localStorage.setItem("token", jsonData.data.access_token);
          window.location.assign("/");
        } else {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: jsonData.error
          });
        }
      }).catch((err) => { console.log(err); });
  }
};
