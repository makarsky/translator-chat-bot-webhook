const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD,
});
redisClient.on('error', (err) => console.log('Redis redisClient Error', err));
redisClient.connect();

module.exports = redisClient;
