const redis = require("redis");
const client = redis.createClient({ host: "localhost", port: 6379 });
const { promisify } = require("util");

client.on("ready", function () {
  console.log("Redis is ready");
});

client.on("error", function (error) {
  if (process.env.NODE_ENV === "production") {
    console.log(error);
  }
});

// api is asynchronous => promise
module.exports = {
  client,
  get: promisify(client.get).bind(client),
  set: promisify(client.set).bind(client),
  del: promisify(client.del).bind(client)
};
