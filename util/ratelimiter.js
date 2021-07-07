const Cache = require("./cache");
const WINDOW = process.env.RATE_LIMIT_WINDOW;
const QUOTA = process.env.RATE_LIMIT_COUNT;

async function rateLimiterRoute (req, res, next) {
  if (!Cache.client.ready) { // if redis not connected
    return next();
  } else {
    try {
      const ip = "ip#" + req.ip.replace(/^.*:/, "");
      const result = await rateLimiter(ip);
      if (result.status === 200) {
        return next();
      } else {
        res.status(result.status).send(result.message);
      }
    } catch {
      return next();
    }
  }
};

function rateLimiter (ip) {
  return new Promise((resolve, reject) => {
    Cache.client
      .multi() // redis transaction: commands are queued up until an EXEC is issued
      .set([ip, 0, "EX", WINDOW, "NX"]) // set if it not existed, and will expired after 1 sec
      .incr(ip)
      .exec((err, replies) => {
        if (err) {
          resolve({ status: 500, message: "Internal Server Error" });
        }
        console.log(replies);
        const reqCount = replies[1];
        if (reqCount > QUOTA) {
          resolve({ status: 429, message: `Quota of ${QUOTA} per ${WINDOW}sec exceeded` });
        }
        resolve({ status: 200, message: "OK" });
      });
  });
}

module.exports = { rateLimiterRoute };
