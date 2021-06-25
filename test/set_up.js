const app = require("../app");
const chai = require("chai");
const chaiHttp = require("chai-http");

chai.use(chaiHttp);

const assert = chai.assert;
const requester = chai.request(app).keepOpen();

module.exports = {
  assert,
  requester
};
