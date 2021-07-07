const { pool } = require("./mysqlcon");
const { createHash } = require("crypto");
const jwt = require("jsonwebtoken");
const { TOKEN_EXPIRE, TOKEN_SECRET } = process.env; // 10 mins by ms

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
  }, TOKEN_SECRET, { algorithm: "HS256", expiresIn: `${TOKEN_EXPIRE}s` });
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
        resolve({ user });
      });
    });
  });
};

const nativeSignIn = async (email, password) => {
  return new Promise((resolve, reject) => {
    try {
      // check email exists or not
      pool.query("SELECT * FROM user WHERE email = ?", [email], (err, result) => {
        if (err) throw err;

        if (result.length === 0) {
          resolve({ error: "You don't have an account, please signup.", status: 403 });
          return;
        }
        // verify pwd, update login time, and then genJWT for this signin
        if (result[0].password === getHashed(password)) {
          const loginAt = new Date();
          updateLoginTime(loginAt, result[0].id);

          result[0].login_at = loginAt;
          result[0].access_token = getJWToken({ provider: result[0].provider, name: result[0].name, email: result[0].email });
          result[0].access_expired = TOKEN_EXPIRE;
          resolve({ user: result[0] });
        } else {
          resolve({ error: "Wrong password, please Login again.", status: 403 });
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};

const updateLoginTime = (loginAt, id) => {
  return new Promise((resolve, reject) => {
    pool.getConnection(function (err, connection) {
      if (err) reject(err);
      connection.beginTransaction(function (err) {
        if (err) { // Transaction Error (Rollback and release connection)
          connection.rollback(function () {
            connection.release();
          });
        } else {
          connection.query("UPDATE user SET login_at = ? WHERE id = ?", [loginAt, id], function (err, result) {
            if (err) { // Query Error (Rollback and release connection)
              connection.rollback(function () {
                connection.release();
              });
            } else {
              connection.commit(function (err) {
                if (err) {
                  connection.rollback(function () {
                    connection.release();
                  });
                } else {
                  // Success
                  connection.release();
                  resolve(result);
                }
              });
            }
          });
        }
      });
    });
  });
};

const getUserData = (email) => {
  return new Promise((resolve, reject) => {
    pool.query("SELECT * FROM user WHERE email = ?", [email], (err, result) => {
      if (err) reject(err);
      resolve(result[0]);
    });
  });
};

const getUserCapacity = (userId) => {
  return new Promise((resolve, reject) => {
    pool.query("SELECT capacity FROM user WHERE id = ?", userId, (err, result) => {
      if (err) reject(err);
      resolve(result[0].capacity);
    });
  });
};

module.exports = {
  role: USER_ROLE,
  signUp,
  nativeSignIn,
  getUserData,
  getUserCapacity
};
