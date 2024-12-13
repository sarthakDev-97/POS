const asyncWrapper = require("../../../middlewares/async");
const { StatusCodes } = require("http-status-codes");
const Product = require("../../../models/products/product");
const favModel = require("../../../models/orders/favourite");
const brandModel = require("../../../models/products/brand");
const categoryModel = require("../../../models/products/category");
const subcategoryModel = require("../../../models/products/subcategory");
const reviewModel = require("../../../models/products/review");
const { toFloat } = require("validator");

const getAllProducts = asyncWrapper(async (req, res) => {
  const { search, searchById, sort, active, page, result } = req.query;
  const queryObject = {};
  const sortQuery = {};
  const itemsPerPage = parseInt(result) || 5;
  const currentPage = parseInt(page) || 1;

  if (search) {
    const brands = await brandModel
      .find({ name: { $regex: search, $options: "i" } })
      .select("_id");
    const category = await categoryModel
      .find({
        name: { $regex: search, $options: "i" },
      })
      .select("_id");
    const subcategory = await subcategoryModel
      .find({
        name: { $regex: search, $options: "i" },
      })
      .select("_id");
    const subcategoryIds = subcategory.map((sub) => sub._id);
    const categoryIds = category.map((cat) => cat._id);
    const brandIds = brands.map((brand) => brand._id);
    queryObject.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { brand: { $in: brandIds } },
      { category: { $in: categoryIds } },
      { subcategory: { $in: subcategoryIds } },
    ];
  }
  if (searchById) {
    queryObject.$or = [
      { brand: searchById },
      { category: searchById },
      { subcategory: searchById },
    ];
  }
  if (sort) {
    sortQuery.sort = sort.split(",").join(" ");
  }
  if (active) {
    queryObject.isActive = active === "true" ? true : false;
  }

  const skipItems = (currentPage - 1) * itemsPerPage;

  let products = await Product.find(queryObject)
    .select(
      "sku name image currentStock minStock isActive unitSellingPriceLow unitSellingPriceHigh tax unit variation"
    )
    .populate([
      { path: "unit", select: "name shortName" },
      { path: "tax", select: "name rate" },
      { path: "variation", select: "type value image" },
    ])
    .sort(sortQuery.sort)
    .limit(itemsPerPage)
    .skip(skipItems)
    .lean();

  if (!products) {
    return res.code(StatusCodes.PARTIAL_CONTENT).send({
      msg: "Products not found. Please check again.",
    });
  }
  products = await Promise.all(
    products.map(async (product) => {
      const review = await reviewModel.aggregate([
        { $match: { product: product._id } },
        { $group: { _id: "$product", avgRating: { $avg: "$rating" } } },
      ]);
      const avgRating = review.length > 0 ? review[0].avgRating : 0;
      return { ...product, rating: toFloat(avgRating?.toFixed(1)) };
    })
  );
  return res.code(StatusCodes.OK).send({
    products,
    msg: "Products retrieved successfully.",
    itemsPerPage: itemsPerPage,
    pageNo: currentPage,
    totalPages: Math.ceil(
      (await Product.countDocuments(queryObject)) / itemsPerPage
    ),
    total: await Product.countDocuments(queryObject),
  });
});

const getProductById = asyncWrapper(async (req, res) => {
  const { id } = await req.params;
  let product = await Product.findById(id)
    .populate("unit category brand subcategory tax variation")
    .lean();
  if (!product) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Product not found. Please check again." });
  }
  const variants = await Product.find({
    _id: { $ne: product._id },
    name: { $regex: new RegExp(`^${product.name.trim()}$`, "i") },
  })
    .select("image variation")
    .populate("variation")
    .lean();
  const favourite = await favModel
    .findOne({
      user: req?.user?.userId,
      product: product?._id,
    })
    .select("_id");
  product.rating = await reviewModel
    .aggregate([
      { $match: { product: product?._id } },
      { $group: { _id: "$product", avgRating: { $avg: "$rating" } } },
    ])
    .then((data) =>
      data.length > 0 ? toFloat(data[0].avgRating?.toFixed(1)) : 0
    );
  return res.code(StatusCodes.OK).send({
    fav: favourite?._id || null,
    product,
    allVariants: variants,
    msg: "Product retrieved successfully.",
  });
});

const createProduct = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin" && req.user.typeofuser !== "seller") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const product = await Product.create({
    ...req.body,
    sku:
      req.body.sku === null || !req.body.sku
        ? `${Math.floor(100000 + Math.random() * 900000)}`
        : req.body.sku,
  });
  const newProd = await Product.findById(product._id)
    .populate({ path: "unit", select: "name" })
    .populate({ path: "category", select: "name" })
    .populate({ path: "brand", select: "name" })
    .populate({ path: "tax", select: "name" })
    .populate({ path: "subcategory", select: "name" })
    .populate({ path: "variation", select: "name type" })
    .lean();

  if (!product) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Product not created. Please check again." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ newProd, msg: "Product created successfully." });
});

const updateProduct = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin" && req.user.typeofuser !== "seller") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const { id } = req.params;
  const product = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate({ path: "unit", select: "name" })
    .populate({ path: "category", select: "name" })
    .populate({ path: "brand", select: "name" })
    .populate({ path: "tax", select: "name" })
    .populate({ path: "subcategory", select: "name" })
    .populate({ path: "variation", select: "value type" })
    .select(
      "sku name image description slug unitPurchasePriceLow unitSellingPriceLow unitPurchasePriceHigh unitSellingPriceHigh currentStock minStock unit category subcategory brand variation tax isActive createdAt updatedAt"
    );

  if (!product) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Product not updated. Please check again." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ product, msg: "Product updated successfully." });
});

const deleteProduct = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const { id } = req.params;
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Product not deleted. Please check again." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ msg: "Product Permanent deletion successful." });
});

const addMultipleProducts = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin" && req.user.typeofuser !== "seller") {
    return res
      .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const { data } = req.body;
  let productsData = [];
  for (let item of data) {
    let sku = null;
    const product = await Product.findOne({
      name: { $regex: new RegExp(`^${item.name.trim()}$`, "i") },
      variation: item?.variation,
      productType: item?.productType,
    });
    sku =
      product && (item.sku === "" || item.sku === null)
        ? product.sku
        : !product && item.sku
        ? item.sku
        : Math.floor(Math.random() * 100000).toString();
    productsData.push({ ...item, sku: sku });
  }
  try {
    const products = await Product.insertMany(productsData, { ordered: false });
    if (!products) {
      return res
        .code(StatusCodes.PARTIAL_CONTENT)
        .send({ msg: "Products not created. Please check again." });
    }
    return res
      .code(StatusCodes.OK)
      .send({ products, msg: "Products inserted successfully." });
  } catch (err) {
    const error = err.errorResponse?.writeErrors?.map((e) => e.index);
    res.code(StatusCodes.OK).send({
      result: err.result,
      NotInserted: error,
      error: "Some products were not inserted due to some duplications.",
      msg: "Products inserted with some warnings.",
    });
  }
});

module.exports = {
  getAllProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  addMultipleProducts,
};
