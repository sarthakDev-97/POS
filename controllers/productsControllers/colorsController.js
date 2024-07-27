const { StatusCodes } = require("http-status-codes");
const Color = require("../../models/products/colors");
const asyncWrapper = require("../../middlewares/async");

const getAllColors = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "You are not authorized to perform this action" });
  }
  const colors = await Color.find()
    .select("-__v -updatedAt -createdAt")
    .sort("name");
  if (!colors) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Colors not found. Please check again." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ colors, msg: "Colors retrieved successfully." });
});

const createColor = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const { name, color_code } = req.body;
  const color = await Color.create({ name, color_code });
  if (!color) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Color not created. Please check again." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ color, msg: "Color created successfully." });
});

const getColorsByID = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const { id } = req.params;
  const color = await Color.findById(id);
  if (!color) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Color not found. Please check again." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ color, msg: "Color retrieved successfully." });
});

const updateColor = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const { id } = req.params;
  const color = await Color.findByIdAndUpdate(id, req.body, { new: true });
  if (!color) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Color not updated. Please check again." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ color, msg: "Color updated successfully." });
});

const deleteColor = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const { id } = req.params;
  const color = await Color.findByIdAndDelete(id);
  if (!color) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Color not deleted. Please check again." });
  }
  return res.code(StatusCodes.OK).send({ msg: "Color deleted successfully." });
});

module.exports = {
  getAllColors,
  createColor,
  getColorsByID,
  updateColor,
  deleteColor,
};
