const asyncHandler = require("../../middlewares/async");
const myCache = require("../../middlewares/caching");
const Unit = require("../../models/products/unit");
const { StatusCodes } = require("http-status-codes");

const getAllUnits = asyncHandler(async (req, res) => {
  const cachedUnits = myCache.get("units");
  if (cachedUnits !== undefined) {
    return res.status(StatusCodes.OK).send({
      units: myCache.get("units"),
      msg: "Units retrieved successfully.",
    });
  }
  const units = await Unit.find()
    .select("-__v -createdAt")
    .sort({ name: 1 })
    .lean();
  if (!units) {
    return res
      .status(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Units not found. Please check again." });
  }
  myCache.set("units", units, 7200);
  return res
    .code(StatusCodes.OK)
    .send({ units, msg: "Units retrieved successfully." });
});

const getUnitById = asyncHandler(async (req, res) => {
  const { id } = await req.params;
  const unit = await Unit.findById(id).select("-__v").lean();
  if (!unit) {
    return res
      .status(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Unit not found. Please check again." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ unit, msg: "Unit retrieved successfully." });
});

const getUnitDD = asyncHandler(async (req, res) => {
  const cachedUnitsDD = myCache.get("unitsDD");
  if (cachedUnitsDD !== undefined) {
    return res.code(StatusCodes.OK).send({
      units: myCache.get("unitsDD"),
      msg: "Units retrieved successfully.",
    });
  }
  const units = await Unit.find().select("name").sort({ name: 1 }).lean();
  if (!units) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Units not found. Please check again." });
  }
  myCache.set("unitsDD", units, 7200);
  return res
    .code(StatusCodes.OK)
    .send({ units, msg: "Units retrieved successfully." });
});

const createUnit = asyncHandler(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const unit = await Unit.create(req.body);
  if (!unit) {
    return res
      .status(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Unit not created. Please check again." });
  }
  myCache.del("units");
  myCache.del("unitsDD");
  return res
    .code(StatusCodes.CREATED)
    .send({ unit, msg: "Unit created successfully." });
});

const updateUnit = asyncHandler(async (req, res) => {
  const { id } = await req.params;
  if (!id) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Please provide unit id." });
  }
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const unit = await Unit.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!unit) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Unit not found. Please check again." });
  }
  myCache.del("units");
  myCache.del("unitsDD");
  return res
    .code(StatusCodes.OK)
    .send({ unit, msg: "Unit updated successfully." });
});

const deleteUnit = asyncHandler(async (req, res) => {
  const { id } = await req.params;
  if (!id) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Please provide unit id." });
  }
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const unit = await Unit.findByIdAndDelete(req.params.id);
  if (!unit) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Unit not found. Please check again." });
  }
  myCache.del("units");
  myCache.del("unitsDD");
  return res.code(StatusCodes.OK).send({ msg: "Unit deleted successfully." });
});

module.exports = {
  getAllUnits,
  getUnitDD,
  createUnit,
  updateUnit,
  deleteUnit,
  getUnitById,
};
