const User = require("../../models/user");
const { StatusCodes } = require("http-status-codes");
const asyncWrapper = require("../../middlewares/async");
const myCache = require("../../middlewares/caching");

const getAllUsers = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser === "admin") {
    // cachedUsers = myCache.get("users");
    // if (cachedUsers !== undefined) {
    //   return res.code(StatusCodes.OK).send({
    //     users: myCache.get("users"),
    //     msg: "These users needs approval.",
    //   });
    // }

    const { search, page, result } = req.query;
    const queryObject = {};
    const itemsPerPage = parseInt(result) || 5;
    const currentPage = parseInt(page) || 1;

    if (search) {
      queryObject.$or = [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const skipItems = (currentPage - 1) * itemsPerPage;

    const users = await User.find(queryObject)
      .select("-password -__v -address")
      .sort("isApproved -createdAt")
      .limit(itemsPerPage)
      .skip(skipItems)
      .lean();
    if (!users) {
      return res
        .code(StatusCodes.PARTIAL_CONTENT)
        .send({ msg: "Users not found. Please check again." });
    }
    // myCache.set("users", users, 900);
    return res.code(StatusCodes.OK).send({
      users,
      msg: "Users get Success.",
      itemsPerPage: itemsPerPage,
      pageNo: currentPage,
      totalPages: Math.ceil(
        (await User.countDocuments(queryObject)) / itemsPerPage
      ),
      total: await User.countDocuments(queryObject),
    });
  }
  res
    .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
    .send({ msg: "You are not authorized to perform this action." });
});

const getUserById = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser === "admin") {
    const { id } = req.params;
    const user = await User.findById(id).select("-password -__v").lean();
    if (!user) {
      return res
        .code(StatusCodes.PARTIAL_CONTENT)
        .send({ msg: "User not found. Please check again." });
    }
    return res.code(StatusCodes.OK).send({ user });
  }
  res
    .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
    .send({ msg: "You are not authorized to perform this action." });
});

const patchUserById = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser === "admin") {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
      id,
      { isApproved: true },
      {
        new: true,
      }
    );
    if (!user) {
      return res
        .code(StatusCodes.PARTIAL_CONTENT)
        .send({ msg: "User not found. Please check again." });
    }
    // myCache.del("users");
    return res.code(StatusCodes.OK).send({ user });
  }
  res
    .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
    .send({ msg: "You are not authorized to perform this action." });
});

const patchAll = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser === "admin") {
    const idsOfUsers = req.body.ids;
    const users = await User.updateMany(
      { _id: { $in: idsOfUsers } },
      { isApproved: true },
      {
        new: true,
      }
    );
    if (!users) {
      return res
        .code(StatusCodes.PARTIAL_CONTENT)
        .send({ msg: "Users not found. Please check again." });
    }
    const updatedData = await User.find({ _id: { $in: idsOfUsers } })
      .sort({ createdAt: 1 })
      .select("-password -__v -address")
      .lean();
    if (!updatedData) {
      return res
        .code(StatusCodes.PARTIAL_CONTENT)
        .send({ msg: "Users not found. Please check again." });
    }
    // myCache.del("users");
    return res
      .code(StatusCodes.OK)
      .send({ users: updatedData, msg: "These users got approved." });
  }
  res
    .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
    .send({ msg: "You are not authorized to perform this action." });
});

module.exports = { getAllUsers, getUserById, patchUserById, patchAll };
