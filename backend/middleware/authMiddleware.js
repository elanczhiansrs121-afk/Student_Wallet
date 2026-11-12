
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check whether Authorization header exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    // Extract and clean token
    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    // Check JWT secret
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing");
      return res.status(500).json({
        message: "Server authentication configuration error",
      });
    }

    // Verify token using the same secret as login
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Attach decoded user details
    req.user = decoded;

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
