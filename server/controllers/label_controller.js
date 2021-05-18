const coordinates = (req, res) => {
  console.log(req.file);
  res.status(200).send("got it");
};

module.exports = {
  coordinates
};
