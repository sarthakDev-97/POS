const { StatusCodes } = require("http-status-codes");
const User = require("../../models/user");
const addressModel = require("../../models/address");
const asyncWrapper = require("../../middlewares/async");
const myCache = require("../../middlewares/caching");

const getUser = asyncWrapper(async (req, res) => {
  const user = await User.findById(req.user.userId)
    .select("-password -__v")
    .lean();
  if (!user) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "User not found. Please check again." });
  }
  const addresses = await addressModel.find({ user: req.user.userId }).lean();
  if (!addresses) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Addresses not found. Please check again." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ user, addresses, msg: "User retrieved successfully." });
});

const patchUser = asyncWrapper(async (req, res) => {
  if (req.body.password !== undefined && req.body.newPassword !== undefined) {
    const user = await User.findById(req.user.userId);
    const comparePass = await bcrypt.compare(
      req.body.password.trim(),
      user.password
    );
    if (!comparePass) {
      return res
        .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
        .send({ msg: "Incorrect password. Please check again." });
    }
    const saltGen = await bcrypt.genSalt(10);
    const encPass = await bcrypt.hashSync(req.body.newPassword.trim(), saltGen);
    const updateUser = await User.findByIdAndUpdate(
      req.user.userId,
      { ...req.body, password: encPass },
      {
        new: true,
        runValidators: true,
      }
    )
      .select("-password -__v")
      .lean();
    if (!updateUser) {
      return res
        .code(StatusCodes.PARTIAL_CONTENT)
        .send({ msg: "User not found. Please check again." });
    }
    myCache.del("users");
    return res.code(StatusCodes.OK).send({ user: updateUser });
  }
  const user = await User.findByIdAndUpdate(req.user.userId, req.body, {
    new: true,
    runValidators: true,
  })
    .select("-password -__v")
    .lean();
  if (!user) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "User not found. Please check again." });
  }
  myCache.del("users");
  return res.code(StatusCodes.OK).send({ user });
});

const deleteUser = asyncWrapper(async (req, res) => {
  const user = await User.findByIdAndDelete(req.user.userId).lean();
  if (!user) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "User not found. Please check again." });
  }
  myCache.del("users");
  return res.code(StatusCodes.OK).send({ msg: "User deleted successfully." });
});

module.exports = { getUser, patchUser, deleteUser };
