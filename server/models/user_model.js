const { pool } = require("./mysqlcon");
const { createHash } = require("crypto");
const jwt = require("jsonwebtoken");
const { TOKEN_EXPIRE, TOKEN_SECRET } = process.env; // 10 mins by secs

const USER_ROLE = {
  ADMIN: 0,
  USER: 1
};

const getHashed = (password) => {
  const hash = createHash("sha256");
  hash.update(password);
  return hash.digest("hex");
};

const getJWToken = (payload) => {
  const accessToken = jwt.sign({
    provider: payload.provider,
    name: payload.name,
    email: payload.email
  }, TOKEN_SECRET, { algorithm: "HS256", expiresIn: TOKEN_EXPIRE });
  return accessToken;
};

const signUp = (name, roleId, email, password) => {
  return new Promise((resolve, reject) => {
    pool.query("SELECT email FROM user WHERE email = ?", email, (err, result) => {
      if (err) reject(err);
      if (result.length > 0) {
        resolve({ error: "Email Already Exists" });
        return;
      }

      const user = {
        provider: "native",
        role_id: roleId,
        name: name,
        email: email,
        password: getHashed(password),
        picture: null
      };

      const post = { role_id: roleId, provider: "native", email: email, name: name, password: getHashed(password), picture: null };
      pool.query("INSERT INTO user SET ?", post, (err, result) => {
        if (err) reject(err);
        user.id = result.insertId;
        user.access_token = getJWToken(user);
        user.access_expired = TOKEN_EXPIRE;
        resolve(user);
      });
    });
  });
};

module.exports = {
  USER_ROLE,
  signUp
};
