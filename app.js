const path = require("path");
require("dotenv").config();
const port = process.env.PORT;

// Express Initialization
const express = require("express");
const app = express();

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api/" + process.env.API_VERSION,
  [
  // require("./server/routes/")
    require("./server/routes/label_route")
  ]
);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./public/html/canvas.html"));
});

// Page not found
app.use((err, res, next) => {
  // console.log(err);
  res.status(500).send(err);
});

// Error handling
// app.use((err, res) => {
//   console.log(err);
//   res.statuts(500).send("Internal Server Error");
// });

app.listen(port, () => {
  console.log(`The application is running on port ${port}`);
});

module.exports = app;
