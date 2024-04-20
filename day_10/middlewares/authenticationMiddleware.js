require("dotenv").config();
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token)
    return res.status(401).json({ message: "Authentication token required" });

  jwt.verify(token, process.env.secret_key, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.userId = decoded.userID;
    next();
  });
};

module.exports = authenticateToken;
