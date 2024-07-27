const { StatusCodes } = require("http-status-codes");
const asyncWrapper = require("../middlewares/async");
const Brand = require("../models/products/brand");
const Product = require("../models/products/product");
const Category = require("../models/products/category");
const Subcategory = require("../models/products/subcategory");

const searchResult = asyncWrapper(async (req, res) => {
  const { search, from } = req.query;
  let queryObject = {};
  if (search) {
    queryObject = { name: { $regex: search, $options: "i" } };
  }

  var response;

  switch (from) {
    case "b":
      response = await Brand.find(queryObject).select("name").lean();
      break;
    case "p":
      response = await Product.find(queryObject)
        .where("isActive")
        .equals(true)
        .select("name image color")
        .lean();
      break;
    case "c":
      response = await Category.find(queryObject).select("name").lean();
      break;
    case "sc":
      response = await Subcategory.find(queryObject).select("name").lean();
      break;
    default:
      return res.status(StatusCodes.TEMPORARY_REDIRECT).send({
        msg: "Value in from can only be (b, p, c or sc).Other values not accepted.",
      });
  }

  return res.status(StatusCodes.OK).send({
    response,
    msg: "Search result retrieved successfully.",
  });
});

module.exports = { searchResult };
