const { promisify } = require("util"); // util from native nodejs library
const redis = require("redis");
const redisClient = redis.createClient({ host: "localhost", port: 6379 });

redisClient.on("ready", function () {
  console.log("Redis is ready");
});

redisClient.on("error", function () {
  if (process.env.NODE_ENV === "production") {
    console.log("Error in Redis");
  }
});

const get = promisify(redisClient.get).bind(redisClient);
const set = promisify(redisClient.set).bind(redisClient);
const del = promisify(redisClient.del).bind(redisClient);

module.exports = {
  client: redisClient,
  get,
  set,
  del
};
