const { StatusCodes } = require("http-status-codes");
const addressModel = require("../../models/address");
const asyncWrapper = require("../../middlewares/async");

const getAllAddress = asyncWrapper(async (req, res) => {
  const address = await addressModel
    .find({ user: req.user.userId })
    .select("-__v -user")
    .lean();
  if (!address) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Address not found. Please check again." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ address, msg: "Address retrieved successfully." });
});

const createAddress = asyncWrapper(async (req, res) => {
  const address = await addressModel.create({
    ...req.body,
    user: req.user.userId,
  });
  if (!address) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Address not created. Please check again." });
  }
  return res
    .code(StatusCodes.CREATED)
    .send({ address, msg: "Address created successfully." });
});

const getAddressById = asyncWrapper(async (req, res) => {
  const { id } = await req.params;
  const address = await addressModel
    .findOne({ _id: id, user: req.user.userId })
    .select("-__v -user")
    .lean();
  if (!address) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Address not found. Please check again." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ address, msg: "Address retrieved successfully." });
});

const updateAddress = asyncWrapper(async (req, res) => {
  const { id } = await req.params;
  const address = await addressModel
    .findOneAndUpdate({ _id: id, user: req.user.userId }, req.body, {
      new: true,
    })
    .select("-__v -user")
    .lean();
  if (!address) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Address not updated. Please check again." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ address, msg: "Address updated successfully." });
});

const deleteAddress = asyncWrapper(async (req, res) => {
  const { id } = await req.params;
  const address = await addressModel
    .findOneAndDelete({ _id: id, user: req.user.userId })
    .lean();
  if (!address) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Address not deleted. Please check again." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ msg: "Address deleted successfully." });
});

module.exports = {
  getAllAddress,
  createAddress,
  getAddressById,
  updateAddress,
  deleteAddress,
};
