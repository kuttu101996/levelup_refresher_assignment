const NodeCache = require("node-cache");
const cache = new NodeCache();

function cacheMiddleware(req, res, next) {
  const key = req.originalUrl || req.url;

  const cachedResponse = cache.get(key);
  if (cachedResponse) {
    console.log("Cache hit:", key);
    return res.status(200).json(cachedResponse);
  }

  console.log("Cache miss:", key);

  const originalJson = res.json;
  res.json = (body) => {
    cache.set(key, body);
    return originalJson.call(res, body);
  };

  next();
}

module.exports = cacheMiddleware;
