// Middleware function for logging requests
const logMiddleware = (req, res, next) => {
  console.log(`Method: ${req.method} \nURL: ${req.originalUrl}`);
  next();
};

module.exports = logMiddleware;
