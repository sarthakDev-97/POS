const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/user");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return next(
      res
        .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
        .send({ msg: "Authentication Invalid." })
    );
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = await jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload._id);
    if (!user) {
      return next(
        res
          .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
          .send({ msg: "Token not valid." })
      );
    }
    req.user = {
      userId: user._id,
      username: user.username,
      typeofuser: user.typeofuser,
    };
    // next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res
        .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
        .send({ msg: error.message });
    }
    console.log(error);
    return res
      .code(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ msg: "Internal Server Error" });
  }
};

module.exports = authMiddleware;
