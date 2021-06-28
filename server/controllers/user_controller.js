require("dotenv").config();
const validator = require("validator");
const User = require("../models/user_model");
const { getLabelCount } = require("../models/label_model");

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
      access_token: user.access_token,
      access_expired: user.access_expired,
      user: {
        id: user.id,
        provider: user.provider,
        name: user.name,
        email: user.email,
        picture: user.picture
      }
    }
  });
};

const nativeSignIn = async (email, password) => {
  if (!email || !password) {
    return { error: "Request Error: email and password are required.", status: 400 };
  }

  try {
    return await User.nativeSignIn(email, password);
  } catch (error) {
    return { error };
  }
};

const signIn = async (req, res) => {
  const data = req.body;

  let result;
  switch (data.provider) {
    case "native":
      result = await nativeSignIn(data.email, data.password);
      break;

    default:
      // if this expression doesn't match any condition case
      result = { error: "Wrong Request", status: 400 };
  }

  if (result.error) {
    res.status(result.status).send({ error: result.error });
    return;
  }

  const user = result.user;
  if (!user) {
    res.status(500).send({ error: "Database Query Error" });
    return;
  }

  res.status(200).send({
    data: {
      access_token: user.access_token,
      access_expired: user.access_expired,
      login_at: user.login_at,
      user: {
        id: user.id,
        provider: user.provider,
        name: user.name,
        email: user.email,
        picture: user.picture
      }
    }
  });
};

const getUserProfile = async (req, res) => {
  try {
    const labelCount = await getLabelCount(req.user.id);

    res.status(200).json({
      data: {
        name: req.user.name,
        email: req.user.email,
        imgQty: req.user.img_qty,
        labelCount: labelCount,
        capacity: req.user.capacity // KB
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error.");
  }
};

const checkAuth = (req, res) => {
  res.json(req.user);
};

module.exports = {
  signUp,
  signIn,
  getUserProfile,
  checkAuth
};
