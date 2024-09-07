const asyncWrapper = require("../../../middlewares/async");
const { StatusCodes } = require("http-status-codes");
const Product = require("../../../models/products/product");
const Unit = require("../../../models/products/unit");
const Tax = require("../../../models/products/tax");
const Brand = require("../../../models/products/brand");
const Category = require("../../../models/products/category");
const Subcategory = require("../../../models/products/subcategory");
const myCache = require("../../../middlewares/caching");
const Variation = require("../../../models/products/variation");

const productComponents = asyncWrapper(async (req, res) => {
  const data = req.data;
  let newUpdatedData = [];
  if (!data) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Error fetching csv data." });
  }

  const unitSet = new Set();
  const taxSet = new Set();
  const brandSet = new Set();
  const categorySet = new Set();
  const subcategorySet = new Set();
  const variationSet = new Set();
  const cateSubSet = new Set();

  data.forEach((element) => {
    element.unit && unitSet.add(element.unit.trim());
    element.tax && taxSet.add(element.tax.trim());
    element.brand && brandSet.add(element.brand.trim());
    element.category && categorySet.add(element.category.trim());
    element.subCategory && subcategorySet.add(element.subCategory.trim());
    element.category &&
      element.subCategory &&
      cateSubSet.add(
        element.category.trim() + " - " + element.subCategory.trim()
      );
    element.color && variationSet.add(element.color.trim());
  });

  for (let item of brandSet.values()) {
    let brand1 = await Brand.findOne({
      name: new RegExp(`^${item}$`, "i"),
    });
    if (!brand1) {
      brand1 = await Brand.create({ name: item });
    }
    data.map((element) => {
      if (element.brand === item) {
        element.brand = brand1._id.toString();
      }
    });
  }

  // for (let item of categorySet.values()) {
  //   let category1 = await Category.findOne({
  //     name: new RegExp(`^${item}$`, "i"),
  //   });
  //   if (!category1) {
  //     category1 = await Category.create({ name: item });
  //   }
  //   data.map((element) => {
  //     if (element.category.trim() === item) {
  //       element.category = category1._id.toString();
  //     }
  //   });
  // }

  for (let item of cateSubSet.values()) {
    let category1 = await Category.findOne({
      name: new RegExp(`^${item.split(" - ")[0]}$`, "i"),
    });
    if (!category1) {
      category1 = await Category.create({ name: item.split(" - ")[0] });
    }
    let subcategory1 = await Subcategory.findOne({
      name: new RegExp(`^${item.split(" - ")[1]}$`, "i"),
    });
    if (!subcategory1) {
      subcategory1 = await Subcategory.create({
        name: item.split(" - ")[1],
        category: category1._id.toString(), // Add parent category here
      });
    }
    data.map((element) => {
      if (element.subCategory.trim() === item.split(" - ")[1]) {
        element.subcategory = subcategory1._id.toString();
      }
      if (element.category.trim() === item.split(" - ")[0]) {
        element.category = category1._id.toString();
      }
    });
  }

  for (let item of unitSet.values()) {
    let unit1 = await Unit.findOne({
      name: new RegExp(`^${item}$`, "i"),
    });
    if (!unit1) {
      unit1 = await Unit.create({ name: item });
    }
    data.map((element) => {
      if (element.unit === item) {
        element.unit = unit1._id.toString();
      }
    });
  }

  for (let item of taxSet.values()) {
    let tax1 = await Tax.findOne({
      name: item.split("@")[0].trim(),
    });
    if (!tax1) {
      const taxRate = item.split("@")[1].split("%")[0].trim();
      tax1 = await Tax.create({
        name: item.split("@")[0].trim(),
        rate: taxRate,
      });
    }
    data.map((element) => {
      if (element.tax === item) {
        element.tax = tax1._id.toString();
      }
    });
  }

  for (let item of variationSet.values()) {
    let variation1 = await Variation.findOne({
      value: new RegExp(`^${item.split("-")[1].trim()}$`, "i"),
      type: new RegExp(`^${item.split("-")[0].trim()}$`, "i"),
    });
    if (!variation1) {
      variation1 = await Variation.create({
        value: item.split("-")[1].trim(),
        type: item.split("-")[0].trim(),
      });
    }
    data.map((element) => {
      if (element.color === item) {
        element.variation = { variation: variation1._id.toString() };
      }
    });
  }

  for (let item of data) {
    let sku1 = null;
    if (item.sku === null || !item.sku || item.sku.trim() !== "") {
      const product = await Product.findOne({
        name: { $regex: new RegExp(`^${item?.name?.trim()}$`, "i") },
        "variation.variation": item?.variation?.variation,
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
    item.sku = sku1;
  }

  // Helper function to introduce a delay

  // return res.code(StatusCodes.OK).send({ newData });

  try {
    const products = await Product.insertMany(data, { ordered: false });

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

module.exports = { productComponents };
