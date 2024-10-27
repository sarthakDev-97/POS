const asyncWrapper = require("../../middlewares/async");
const User = require("../../models/user");
const { StatusCodes } = require("http-status-codes");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const notificationModel = require("../../models/notifications");

const login = asyncWrapper(async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username: username.trim() });
  if (!user) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Username not found. Please check again." });
  }
  const passwordMatch = await bcrypt.compare(password.trim(), user.password);
  if (!passwordMatch) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Incorrect password. Please check again." });
  }
  if (!user.isApproved) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Your account is not approved. Please wait." });
  }
  const responseUser = await User.findById(user._id)
    .select("-password -__v -address")
    .lean();
  const token = jwt.sign(
    {
      username: user.username,
      typeofuser: user.typeofuser,
      _id: user._id,
      isApproved: user.isApproved,
    },
    process.env.JWT_SECRET,
    { expiresIn: "90d" }
  );
  return res
    .code(StatusCodes.OK)
    .send({ msg: "Login Successful", user: responseUser, token });
});

const signup = asyncWrapper(async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username: username.trim() });
  if (user) {
    return res
      .send({ msg: "User already exists. Please login." })
      .code(StatusCodes.PARTIAL_CONTENT);
  }
  const saltGen = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hashSync(password.trim(), saltGen);
  const newUser = await User.create({
    ...req.body,
    username: username.trim(),
    password: hashedPassword,
    isApproved: req.body.typeofuser?.trim() === "admin" ? true : false,
  });
  if (!newUser) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "User creation failed. Please try again." });
  }
  const responseUser = await User.findOne({ _id: newUser._id })
    .select("-password -__v -address")
    .lean();
  if (responseUser.typeofuser === "admin") {
    const token = jwt.sign(
      {
        username: newUser.username,
        typeofuser: newUser.typeofuser,
        _id: newUser._id,
        isApproved: newUser.isApproved,
      },
      process.env.JWT_SECRET,
      { expiresIn: "90d" }
    );
    return res
      .code(StatusCodes.OK)
      .send({ msg: "Signup Successful.", user: responseUser, token });
  }
  const notify = await notificationModel.create({
    user: null,
    title: "New User Registered",
    description: `New user ${newUser.username} has registered. Please perform approval actions.`,
    type: "registration",
    for: "admin",
  });
  if (!notify) {
  }
  return res.code(StatusCodes.OK).send({
    msg: "Signup Successful. Your account has been passed for admin approval.",
    user: responseUser,
    token: null,
  });
});

module.exports = {
  login,
  signup,
};
