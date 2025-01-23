const asyncWrapper = require("../../middlewares/async");
const Category = require("../../models/products/category");
const Subcategory = require("../../models/products/subcategory");
const { StatusCodes } = require("http-status-codes");
const myCache = require("../../middlewares/caching");

const getAllSubcategory = asyncWrapper(async (req, res) => {
  const { id } = await req.params;
  const subcategory = await Subcategory.find({ category: id })
    .select("-__v")
    .sort({ name: 1 })
    .lean();
  if (!subcategory) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Subcategory not found for the given category." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ subcategory, msg: "Subcategories retrieved successfully." });
});

const getSubcategory = asyncWrapper(async (req, res) => {
  const { id } = await req.params;
  const subcategory = await Subcategory.findById(id).select("-__v").lean();
  if (!subcategory) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Subcategory not found. Please check again." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ subcategory, msg: "Subcategory retrieved successfully." });
});

const addSubcategory = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const id = await req.body.category;
  if (!id) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Please provide category id." });
  }
  const category = await Category.findById(id);
  if (!category) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Category not found. Please check again." });
  }
  const subcategory = await Subcategory.create({ ...req.body, category: id });
  if (!subcategory) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Subcategory not created. Please check again." });
  }
  myCache.del("categories");
  myCache.del("categoriesDD");
  myCache.del("categoriesWithSub");
  return res
    .code(StatusCodes.CREATED)
    .send({ subcategory, msg: "Subcategory created successfully." });
});

const updateSubcategory = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const { id } = await req.params;
  const subcategory = await Subcategory.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!subcategory) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Subcategory not found. Please check again." });
  }
  myCache.del("categories");
  myCache.del("categoriesDD");
  myCache.del("categoriesWithSub");
  return res
    .code(StatusCodes.OK)
    .send({ subcategory, msg: "Subcategory updated successfully." });
});

const deleteSubcategory = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const { id } = await req.params;
  const subcategory = await Subcategory.findByIdAndDelete(id);
  if (!subcategory) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Subcategory not found. Please check again." });
  }
  myCache.del("categories");
  myCache.del("categoriesDD");
  myCache.del("categoriesWithSub");
  return res
    .code(StatusCodes.OK)
    .send({ msg: "Subcategory deleted successfully." });
});

const getAll = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const subcategories = await Subcategory.find()
    .select("-__v")
    .sort({ name: 1 })
    .lean();
  return res
    .code(StatusCodes.OK)
    .send({ subcategories, msg: "Subcategories retrieved successfully." });
});

module.exports = {
  getSubcategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getAllSubcategory,
  getAll,
};
