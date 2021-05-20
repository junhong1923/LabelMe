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
    // case "facebook":
    //   result = await facebookSignIn(data.access_token);
    //   break;
    default:
      // if this expression doesn't match any condition case
      result = { error: "Wrong Request", status: 400 };
  }

  if (result.error) {
    // const statusCode = result.status ? result.status : 403;
    res.status(result.status).send({ error: result.error });
    return;
  }
  console.log(result);
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
  res.status(200).json({
    data: {
      provider: req.user.provider,
      name: req.user.name,
      email: req.user.email,
      picture: req.user.picture
    }
  });
};

module.exports = {
  signUp,
  signIn,
  getUserProfile
};
