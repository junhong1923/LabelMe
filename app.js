const path = require("path");
require("dotenv").config();
const port = process.env.PORT;

// Express Initialization
const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("json spaces", 2);

// Enable All CORS Requests
app.use(cors());

// API routes
app.use("/api/" + process.env.API_VERSION,
  [
    require("./server/routes/user_route"),
    require("./server/routes/image_route"),
    require("./server/routes/label_route")
  ]
);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./public/html/index.html"));
});

// Page not found
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "/public/404.html"));
});

// Error handling
app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).send("Error handling: Internal Server Error");
});

app.listen(port, () => {
  console.log(`The application is running on port ${port}`);
});

module.exports = app;
