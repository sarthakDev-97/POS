const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/user");

const authMiddleware2 = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
  }
  const token = authHeader?.split(" ")[1];
  try {
    const payload = await jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload._id);
    req.user = {
      userId: user?._id,
      username: user?.username,
      typeofuser: user?.typeofuser,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
    }
  }
};

module.exports = authMiddleware2;
