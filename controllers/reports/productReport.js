const { StatusCodes } = require("http-status-codes");
const invoiceModel = require("../../models/orders/invoice");

const productPerformanceReport = async (req, res) => {
  try {
    const { dateFilters } = req.query;
    queryObject = {};

    if (dateFilters) {
      const opMap = {
        ">": "$gt",
        ">=": "$gte",
        "=": "$eq",
        "<": "$lt",
        "<=": "$lte",
      };

      const regEx = /\b(>|>=|=|<|<=)\b/g;
      let filters = dateFilters.replace(regEx, (match) => `_${opMap[match]}_`);

      const options = ["createdAt"];
      filters.split(",").forEach((item) => {
        const [field, op, value] = item.split("_");

        if (options.includes(field)) {
          const fieldFilters = {
            [op]: field === "createdAt" ? new Date(value) : Number(value),
          };
          if (queryObject["date"] !== undefined) {
            queryObject["date"] = { ...queryObject["date"], ...fieldFilters };
          } else {
            queryObject["date"] = fieldFilters;
          }
        }
      });
    }

    const pipeline = [
      {
        $match: {
          "products.product": { $exists: true },
          ...queryObject,
        },
      },
      {
        $unwind: "$products",
      },
      {
        $lookup: {
          from: "products", // Replace with your product collection name
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $group: {
          _id: "$productDetails._id",
          productName: {
            $first: "$productDetails.name",
          },
          productSku: { $first: "$productDetails.sku" },
          totalQuantity: { $sum: "$products.quantity" },
          productDescription: { $first: "$productDetails.description" },
          totalSales: {
            $sum: {
              $multiply: ["$products.purchasedUnitPrice", "$products.quantity"],
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          productName: 1,
          productSku: 1,
          productDescription: 1,
          totalQuantity: 1,
          totalSales: 1,
          averagePrice: {
            $cond: {
              if: { $gt: ["$totalQuantity", 0] },
              then: { $divide: ["$totalSales", "$totalQuantity"] },
              else: 0,
            },
          },
        },
      },
    ];

    const result = await invoiceModel.aggregate(pipeline);

    if (result.length === 0) {
      return null;
    }

    const productData = result;

    return result;
  } catch (error) {
    return null;
  }
};

module.exports = { productPerformanceReport };
