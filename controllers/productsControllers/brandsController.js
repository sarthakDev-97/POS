const asyncHandler = require("../../middlewares/async");
const Brand = require("../../models/products/brand");
const { StatusCodes } = require("http-status-codes");
const myCache = require("../../middlewares/caching");

const getAllBrands = asyncHandler(async (req, res) => {
  const cachedBrands = myCache.get("brands");
  if (cachedBrands !== undefined) {
    return res.status(StatusCodes.OK).send({
      brands: myCache.get("brands"),
      msg: "Brands retrieved successfully.",
    });
  }
  const brands = await Brand.find().select("-__v").sort({ name: 1 }).lean();
  if (!brands) {
    return res
      .status(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Brands not found. Please check again." });
  }
  myCache.set("brands", brands, 7200);
  return res
    .status(StatusCodes.OK)
    .send({ brands, msg: "Brands retrieved successfully." });
});

const getBrandDD = asyncHandler(async (req, res) => {
  const cachedBrandsDD = myCache.get("brandsDD");
  if (cachedBrandsDD !== undefined) {
    return res.code(StatusCodes.OK).send({
      brands: myCache.get("brandsDD"),
      msg: "Brands retrieved successfully.",
    });
  }
  const brands = await Brand.find({ isActive: true })
    .select("name")
    .sort({ name: 1 })
    .lean();
  if (!brands) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Brands not found. Please check again." });
  }
  myCache.set("brandsDD", brands, 7200);
  return res
    .code(StatusCodes.OK)
    .send({ brands, msg: "Brands retrieved successfully." });
});

const getBrandById = asyncHandler(async (req, res) => {
  const { id } = await req.params;
  const brand = await Brand.findById(id).select("-__v").lean();
  if (!brand) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Brand not found. Please check again." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ brand, msg: "Brand retrieved successfully." });
});

const createBrand = asyncHandler(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const brand = await Brand.create(req.body);
  if (!brand) {
    return res
      .status(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Brand not created. Please check again." });
  }
  myCache.del("brands");
  myCache.del("brandsDD");
  return res
    .code(StatusCodes.CREATED)
    .send({ brand, msg: "Brand created successfully." });
});

const updateBrand = asyncHandler(async (req, res) => {
  const { id } = await req.params;
  if (!id) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Please provide brand id." });
  }
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!brand) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Brand not found. Please check again." });
  }
  myCache.del("brands");
  myCache.del("brandsDD");
  return res
    .code(StatusCodes.OK)
    .send({ brand, msg: "Brand updated successfully." });
});

const deleteBrand = asyncHandler(async (req, res) => {
  const { id } = await req.params;
  if (!id) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Please provide brand id." });
  }
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const brand = await Brand.findByIdAndDelete(id);
  if (!brand) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Brand not found. Please check again." });
  }
  myCache.del("brands");
  myCache.del("brandsDD");
  return res.code(StatusCodes.OK).send({ msg: "Brand deleted successfully." });
});

module.exports = {
  getAllBrands,
  getBrandDD,
  createBrand,
  updateBrand,
  deleteBrand,
  getBrandById,
};
