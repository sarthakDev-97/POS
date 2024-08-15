const { StatusCodes } = require("http-status-codes");
const asyncWrapper = require("../../middlewares/async");
const variationModel = require("../../models/products/variation");

const getAllVariation = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .send({ msg: "Unauthorized access. Please login again." });
  }
  res.code(StatusCodes.OK).send({
    variations: [
      "COLOR",
      "NAME",
      "PRINT",
      "CARPET COLOR",
      "B",
      "H",
      "RMS",
      "TYPE",
      "THICKNESS",
      "LIGHT COLOR",
      "CHAIR TYPE",
      "SHADE",
    ],
    msg: "Variations retrieved successfully.",
  });
});

const getVariationById = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.UNAUTHORIZED)
      .send({ msg: "Unauthorized access. Please login again." });
  }
  const { id } = await req.params;
  const variations = await variationModel.find({
    type: id.trim().toUpperCase(),
  });
  if (!variations) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Variation not found. Please check again." });
  }
  res
    .code(StatusCodes.OK)
    .send({ variations, msg: "Variations retrieved successfully." });
});

const createVariation = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.UNAUTHORIZED)
      .send({ msg: "Unauthorized access. Please login again." });
  }
  const variation = await variationModel.create(req.body);
  if (!variation) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ msg: "Variation not created. Please try again." });
  }
  res
    .code(StatusCodes.CREATED)
    .send({ variation, msg: "Variation created successfully." });
});

const updateVariation = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.UNAUTHORIZED)
      .send({ msg: "Unauthorized access. Please login again." });
  }
  const { id } = await req.params;
  const variation = await variationModel.findByIdAndUpdate(id, req.body, {
    new: true,
  });
  if (!variation) {
    return res
      .status(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Variation not updated. Please check again." });
  }
  res
    .code(StatusCodes.OK)
    .send({ variation, msg: "Variation updated successfully." });
});

const deleteVariation = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.UNAUTHORIZED)
      .send({ msg: "Unauthorized access. Please login again." });
  }
  const { id } = await req.params;
  const variation = await variationModel.findByIdAndDelete(id);
  if (!variation) {
    return res
      .status(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Variation not deleted. Please check again." });
  }
  res.code(StatusCodes.OK).send({ msg: "Variation deleted successfully." });
});

module.exports = {
  getAllVariation,
  getVariationById,
  createVariation,
  updateVariation,
  deleteVariation,
};
