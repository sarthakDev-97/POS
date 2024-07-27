const asyncWrapper = require("../../middlewares/async");
const myCache = require("../../middlewares/caching");
const Tax = require("../../models/products/tax");
const { StatusCodes } = require("http-status-codes");

const getAllTax = asyncWrapper(async (req, res) => {
  const cachedTax = myCache.get("tax");
  if (cachedTax !== undefined) {
    return res.status(StatusCodes.OK).send({
      tax: myCache.get("tax"),
      msg: "Taxes retrieved successfully.",
    });
  }
  const tax = await Tax.find().select("-__v").lean();
  if (!tax) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Tax not found. Please check again." });
  }
  myCache.set("tax", tax, 7200);
  return res
    .code(StatusCodes.OK)
    .send({ tax, msg: "Taxes retrieved successfully." });
});

const getTaxDD = asyncWrapper(async (req, res) => {
  const cachedTaxDD = myCache.get("taxDD");
  if (cachedTaxDD !== undefined) {
    return res.status(StatusCodes.OK).send({
      tax: myCache.get("taxDD"),
      msg: "Taxes retrieved successfully.",
    });
  }
  const tax = await Tax.find().select("name rate").lean();
  if (!tax) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Tax not found. Please check again." });
  }
  myCache.set("taxDD", tax, 7200);
  return res
    .code(StatusCodes.OK)
    .send({ tax, msg: "Taxes retrieved successfully." });
});

const getTaxById = asyncWrapper(async (req, res) => {
  const { id } = await req.params;
  const tax = await Tax.findById(id).select("-__v").lean();
  if (!tax) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Tax not found. Please check again." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ tax, msg: "Tax retrieved successfully." });
});

const createTax = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const tax = await Tax.create(req.body);
  if (!tax) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Tax not created. Please check again." });
  }
  myCache.del("tax");
  myCache.del("taxDD");
  return res.code(StatusCodes.OK).send({
    tax,
    msg: "Tax created successfully.",
  });
});

const updateTax = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const tax = await Tax.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!tax) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Tax not updated. Please check again." });
  }
  myCache.del("tax");
  myCache.del("taxDD");
  return res
    .code(StatusCodes.OK)
    .send({ tax, msg: "Tax updated successfully." });
});

const deleteTax = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const tax = await Tax.findByIdAndDelete(req.params.id);
  if (!tax) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Tax not deleted. Please check again." });
  }
  myCache.del("tax");
  myCache.del("taxDD");
  return res.code(StatusCodes.OK).send({ msg: "Tax deleted successfully." });
});

module.exports = {
  getAllTax,
  getTaxDD,
  createTax,
  updateTax,
  deleteTax,
  getTaxById,
};
