const { parse } = require("path");
const asyncHandler = require("../../middlewares/async");
const invoiceModel = require("../../models/orders/invoice");
const { StatusCodes } = require("http-status-codes");

const salesReport = async (req, res) => {
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
      { $match: queryObject },
      {
        $group: {
          _id: "$order", // Group by order ID
          totalPayable: { $sum: "$totalPayable" },
          totalTaxes: { $sum: "$totalTaxes" },
          discount: { $sum: "$discount" },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSales: { $sum: "$totalPayable" },
          totalTaxCollection: { $sum: "$totalTaxes" },
          totalDiscountClaimed: { $sum: "$discount" },
        },
      },
    ];

    const result = await invoiceModel.aggregate(pipeline);
    if (result.length === 0) {
      return null;
    }
    const salesData = result[0];

    const totalSales = await salesData.totalSales.toFixed(2);
    const totalOrders = await salesData.totalOrders.toFixed(2);
    const totalTaxCollection = await salesData.totalTaxCollection.toFixed(2);
    const totalDiscountClaimed = await salesData.totalDiscountClaimed.toFixed(
      2
    );
    const averageOrders =
      totalOrders > 0
        ? (totalSales / totalOrders).toFixed(2)
        : parseFloat(0).toFixed(2);

    const data = {
      totalSales: parseFloat(totalSales),
      totalOrders: parseFloat(totalOrders),
      averageSalesPerOrder: parseFloat(averageOrders),
      totalTaxCollection: parseFloat(totalTaxCollection),
      totalDiscountClaimed: parseFloat(totalDiscountClaimed),
    };

    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

module.exports = { salesReport };
