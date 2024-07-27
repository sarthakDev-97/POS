const asyncWrapper = require("../../middlewares/async");
const Category = require("../../models/products/category");
const { StatusCodes } = require("http-status-codes");
const Subcategory = require("../../models/products/subcategory");
const myCache = require("../../middlewares/caching");

const getAllCategoriesWithSub = asyncWrapper(async (req, res) => {
  const cachedCategoriesWithSub = myCache.get("categoriesWithSub");
  if (cachedCategoriesWithSub !== undefined) {
    return res.code(StatusCodes.OK).send({
      categories: myCache.get("categoriesWithSub"),
      msg: "Categories retrieved successfully.",
    });
  }
  const categories = await Category.find()
    .select("-description -createdAt -__v")
    .sort({ name: 1 })
    .lean();
  if (!categories) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Categories not found. Please check again." });
  }
  const subcategory = await Subcategory.find()
    .select("-__v -createdAt -updatedAt")
    .lean();
  if (!subcategory) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Subcategories not found. Please check again." });
  }
  const response = await categories.map((category) => {
    category.subcategory = [];
    category.subcategory = subcategory?.filter(
      (sub) => sub.category.toString() === category._id.toString()
    );
    return category;
  });
  myCache.set("categoriesWithSub", response, 7200);
  return res
    .code(StatusCodes.OK)
    .send({ categories: response, msg: "Categories retrieved successfully." });
});

const getAllCategories = asyncWrapper(async (req, res) => {
  const cachedCategories = myCache.get("categories");
  if (cachedCategories !== undefined) {
    return res.code(StatusCodes.OK).send({
      categories: myCache.get("categories"),
      msg: "Categories retrieved successfully.",
    });
  }
  const categories = await Category.find()
    .select("name code description updatedAt")
    .sort({ name: 1 })
    .lean();
  if (!categories) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Categories not found. Please check again." });
  }
  myCache.set("categories", categories, 7200);
  return res
    .code(StatusCodes.OK)
    .send({ categories, msg: "Categories retrieved successfully." });
});

const getCategoryById = asyncWrapper(async (req, res) => {
  const { id } = await req.params;
  if (!id) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Please provide category id." });
  }
  const category = await Category.findById(id).select("-__v").lean();
  if (!category) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Category not found. Please check again." });
  }
  const subcategories = await Subcategory.find({ category: id })
    .select("-__v")
    .lean();
  if (!subcategories) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Subcategories not found. Please check again." });
  }
  category.subcategories = await subcategories;
  return res
    .code(StatusCodes.OK)
    .send({ category: category, msg: "Category By Id found." });
});

const getAllDDCategories = asyncWrapper(async (req, res) => {
  const cachedCategoriesDD = myCache.get("categoriesDD");
  if (cachedCategoriesDD !== undefined) {
    return res.code(StatusCodes.OK).send({
      categories: myCache.get("categoriesDD"),
      msg: "Dropdown list retrieved successfully.",
    });
  }
  const categories = await Category.find()
    .select("name code")
    .sort({ name: 1 })
    .lean();
  if (!categories) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Categories not found. Please check again." });
  }
  myCache.set("categoriesDD", categories, 7200);
  return res
    .code(StatusCodes.OK)
    .send({ categories, msg: "Dropdown list retrieved successfully." });
});

const createCategory = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const category = await Category.create(req.body);
  if (!category) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Category not created. Please check again." });
  }
  myCache.del("categories");
  myCache.del("categoriesDD");
  myCache.del("categoriesWithSub");
  return res
    .code(StatusCodes.CREATED)
    .send({ category, msg: "Category created successfully." });
});

const updateCategory = asyncWrapper(async (req, res) => {
  const { id } = await req.params;
  if (!id) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Please provide category id." });
  }
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).select("-__v ");
  if (!category) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Category not found. Please check again." });
  }
  myCache.del("categories");
  myCache.del("categoriesDD");
  myCache.del("categoriesWithSub");
  return res
    .code(StatusCodes.OK)
    .send({ category, msg: "Category updated successfully." });
});

const deleteCategory = asyncWrapper(async (req, res) => {
  const { id } = await req.params;
  if (!id) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Please provide category id." });
  }
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const subcategory = await Subcategory.deleteMany({ category: req.params.id });
  if (!subcategory) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Error Deleting Subcategories for this Category." });
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Category not found. Please check again." });
  }
  myCache.del("categories");
  myCache.del("categoriesDD");
  myCache.del("categoriesWithSub");
  return res
    .code(StatusCodes.OK)
    .send({ msg: "Category and its subcategories deleted successfully." });
});

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllDDCategories,
  getCategoryById,
  getAllCategoriesWithSub,
};
