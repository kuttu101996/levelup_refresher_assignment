// Define rate limiting middleware
function rateLimitMiddleware(maxRequests, windowMs) {
  const requestQueue = []; // Queue to store timestamps of recent requests

  // Middleware function
  return (req, res, next) => {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Remove timestamps older than the current window
    while (requestQueue.length > 0 && requestQueue[0] < windowStart) {
      requestQueue.shift();
    }

    // If the number of recent requests exceeds the limit, reject the request
    if (requestQueue.length >= maxRequests) {
      const timeUntilReset = windowMs - (now - requestQueue[0]);
      return res.status(429).json({
        error: "Too Many Requests",
        message: `Rate limit exceeded. Please try again in ${
          timeUntilReset / 1000
        } seconds.`,
      });
    }

    // Add the current timestamp to the request queue
    requestQueue.push(now);

    // Proceed to the next middleware or route handler
    next();
  };
}

module.exports = rateLimitMiddleware;
