const Cache = require("./cache");

function rateLimiter (token) {
  return new Promise((resolve, reject) => {
    Cache.client
      .multi()
      .set([token, 0, "EX", process.env.RATE_LIMIT_WINDOW, "NX"])
      .incr(token)
      .exec((err, replies) => {
        if (err) {
          resolve({ status: 500, message: "Internal Server Error" });
        }
        const reqCount = replies[1];
        if (reqCount > process.env.RATE_LIMIT_COUNT) {
          resolve({ status: 429, message: `Quota of ${process.env.RATE_LIMIT_COUNT} per ${process.env.RATE_LIMIT_WINDOW}sec exceeded` });
        }
        resolve({ status: 200, message: "OK" });
      });
  });
}

const rateLimiterRoute = async (req, res, next) => {
  if (!Cache.client.ready) { // when redis not connected
    return next();
  } else {
    try {
      const token = req.ip;
      const result = await rateLimiter(token);
      if (result.status === 200) {
        return next();
      } else {
        res.status(result.status).send(result.message);
        return;
      }
    } catch {
      return next();
    }
  }
};

module.exports = { rateLimiterRoute };
