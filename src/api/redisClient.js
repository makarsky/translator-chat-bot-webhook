const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD,
});
redisClient.on('error', (err) => console.log('Redis redisClient Error', err));
redisClient.connect();

module.exports = {
  getChatSettingsById: async (chatId) =>
    (await redisClient.json.get(`${chatId}`)) || {},
  setChatSettingsById: async (chatId, key, data) =>
    redisClient.json.set(`${chatId}`, key, data),
};
