const jwt = require("jsonwebtoken");

const userMiddleware = (req, res, next) => {
  console.log("hi im in middleware")
  const token = req.headers.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      message: "No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_USER_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error("JWT verification error:", error.message);
    res.status(403).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = {
  userMiddleware,
};