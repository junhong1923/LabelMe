const navLogin = document.getElementById("nav-login");
const navLabel = document.getElementById("nav-label");

window.onload = (e) => {
  const token = localStorage.getItem("token");
  console.log(token);
};
