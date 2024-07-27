const asyncWrapper = require("../../../middlewares/async");
const { StatusCodes } = require("http-status-codes");
const Product = require("../../../models/products/product");
const Unit = require("../../../models/products/unit");
const Tax = require("../../../models/products/tax");
const Brand = require("../../../models/products/brand");
const Category = require("../../../models/products/category");
const Subcategory = require("../../../models/products/subcategory");
const myCache = require("../../../middlewares/caching");
const Color = require("../../../models/products/colors");

const getAllProducts = asyncWrapper(async (req, res) => {
  const { search, sort, active, page, result } = req.query;
  const queryObject = {};
  const sortQuery = {};
  const itemsPerPage = parseInt(result) || 5;
  const currentPage = parseInt(page) || 1;

  if (search) {
    queryObject.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
    ];
  }
  if (sort) {
    sortQuery.sort = sort.split(",").join(" ");
  }
  if (active) {
    queryObject.isActive = active === "true" ? true : false;
  }

  const skipItems = (currentPage - 1) * itemsPerPage;

  const products = await Product.find(queryObject)
    .select("sku name image currentStock minStock isActive")
    .sort(sortQuery.sort)
    .limit(itemsPerPage)
    .skip(skipItems)
    .lean();

  if (!products) {
    return res.code(StatusCodes.PARTIAL_CONTENT).send({
      msg: "Products not found. Please check again.",
    });
  }
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
    .populate("unit category brand subcategory tax color")
    .lean();
  if (!product) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Product not found. Please check again." });
  }
  const variations = await Product.find({
    _id: { $ne: product._id },
    name: { $regex: new RegExp(`^${product.name.trim()}$`, "i") },
  })
    .populate("color")
    .select("name image color")
    .lean();
  product.variations = variations;
  return res
    .code(StatusCodes.OK)
    .send({ product, msg: "Product retrieved successfully." });
});

const createProduct = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
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
    .populate({ path: "color", select: "name color_code" })
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

const productComponents = asyncWrapper(async (req, res) => {
  const data = req.data;

  if (!data) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Error fetching csv data." });
  }

  // Helper function to introduce a delay
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const interval = 10;

  const newData = [];

  for (const item of data) {
    let unit1 = null;
    if (item.unit && item.unit.trim() !== "") {
      unit1 = await Unit.findOne({
        name: new RegExp(`^${item.unit.trim()}$`, "i"),
      });
      if (!unit1) {
        unit1 = await Unit.create({
          name: item.unit.trim(),
          allowDecimal: true,
        });
        myCache.del("units");
        myCache.del("unitsDD");
      }
    }

    let tax1 = null;
    if (item.tax && item.tax.trim() !== "") {
      tax1 = await Tax.findOne({
        name: item.tax.split("@")[0].trim(),
      });
      if (!tax1) {
        const taxRate = item.tax.split("@")[1].split("%")[0].trim();
        tax1 = await Tax.create({
          name: item.tax.split("@")[0].trim(),
          rate: taxRate,
        });
        myCache.del("tax");
        myCache.del("taxDD");
      }
    }

    let brand1 = null;
    if (item.brand && item.brand.trim() !== "") {
      brand1 = await Brand.findOne({
        name: new RegExp(`^${item.brand.trim()}$`, "i"),
      });
      if (!brand1) {
        brand1 = await Brand.create({ name: item.brand.trim() });
        myCache.del("brands");
        myCache.del("brandsDD");
      }
    }

    let category1 = null;
    if (item.category && item.category.trim() !== "") {
      category1 = await Category.findOne({
        name: new RegExp(`^${item.category.trim()}$`, "i"),
      });
      if (!category1) {
        category1 = await Category.create({ name: item.category.trim() });
        myCache.del("categories");
        myCache.del("categoriesDD");
      }
    }

    let subcategory1 = null;
    if (item.subCategory && item.subCategory.trim() !== "") {
      subcategory1 = await Subcategory.findOne({
        name: new RegExp(`^${item.subCategory.trim()}$`, "i"),
      });
      if (!subcategory1) {
        subcategory1 = await Subcategory.create({
          name: item.subCategory.trim(),
          category: category1._id.toString(),
        });
        myCache.del("subcategories");
        myCache.del("subcategoriesDD");
      }
    }

    let color1 = null;
    if (item.color && item.color.trim() !== "" && item.color !== null) {
      color1 = await Color.findOne({
        name: new RegExp(`^${item?.color?.trim()}$`, "i"),
      });
      if (!color1) {
        color1 = await Color.create({
          name: item?.color?.trim(),
          color_code:
            "#" +
            ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, "0"),
        });
      }
    }

    let sku1 = null;
    if (item.sku === null || !item.sku || item.sku.trim() !== "") {
      const product = await Product.findOne({
        name: { $regex: new RegExp(`^${item?.name?.trim()}$`, "i") },
        color: color1,
        productType: item?.productType,
      });
      if (!product && (item.sku === null || !item.sku)) {
        sku1 = Math.floor(100000 + Math.random() * 900000).toString();
      } else if (product && (item.sku === null || !item.sku)) {
        sku1 = product.sku;
      } else {
        sku1 = item.sku;
      }
    }

    newData.push({
      ...item,
      color: color1 ? color1._id.toString() : null,
      sku: sku1,
      unit: unit1 ? unit1._id.toString() : null,
      tax: tax1 ? tax1._id.toString() : null,
      brand: brand1 ? brand1._id.toString() : null,
      category: category1 ? category1._id.toString() : null,
      subcategory: subcategory1 ? subcategory1._id.toString() : null,
    });

    await delay(interval); // Wait for the specified interval before the next iteration
  }

  // return res.code(StatusCodes.OK).send({ newData });

  try {
    const products = await Product.insertMany(newData, { ordered: false });

    if (!products) {
      return res
        .code(StatusCodes.PARTIAL_CONTENT)
        .send({ msg: "Products not created. Please check again." });
    }

    res
      .code(StatusCodes.OK)
      .send({ newData, msg: "Products inserted successfully." });
  } catch (err) {
    const error = err.errorResponse?.writeErrors?.map((e) => e.index);
    res.code(StatusCodes.OK).send({
      result: err.result,
      RowsThatAreNotInserted: error,
      error: "Some products were not inserted due to some duplications.",
      msg: "Products inserted with some warnings.",
    });
  }
});

const updateProduct = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
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
    .select(
      "sku name image description slug unitPurchasePriceLow unitSellingPriceLow unitPurchasePriceHigh unitSellingPriceHigh currentStock minStock unit category subcategory brand tax isActive"
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
  // if (req.user.typeofuser !== "admin") {
  //   return res
  //     .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
  //     .send({ msg: "You are not authorized to perform this action." });
  // }
  const { data } = req.body;
  let productsData = [];
  for (let item of data) {
    let sku = null;
    const product = await Product.findOne({
      name: { $regex: new RegExp(`^${item.name.trim()}$`, "i") },
      color: item?.color,
      productType: item.productType,
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
  productComponents,
  getProductById,
  updateProduct,
  deleteProduct,
  addMultipleProducts,
};
