require("dotenv").config();
const validator = require("validator");
const User = require("../models/user_model");

const signUp = async (req, res) => {
  let { name } = req.body;
  const { email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).send({ error: "Request Error: name, email and password are required." });
    return;
  }

  if (!validator.isEmail(email)) {
    res.status(400).send({ error: "Request Error: Invalid email format" });
    return;
  }

  name = validator.escape(name);

  const result = await User.signUp(name, User.USER_ROLE.USER, email, password);
  if (result.error) {
    res.status(403).send({ error: result.error });
    return;
  }

  const user = result.user;
  if (!user) {
    res.status(500).send({ error: "Database Query Error" });
    return;
  }

  res.status(200).json({
    data: {
      access_token: result.access_token,
      access_expired: result.access_expired,
      user: {
        id: result.id,
        provider: result.provider,
        name: result.name,
        email: result.email,
        picture: result.picture
      }
    }
  });
};

module.exports = {
  signUp
};
