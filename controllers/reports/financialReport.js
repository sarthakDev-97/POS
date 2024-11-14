const { StatusCodes } = require("http-status-codes");
const invoiceModel = require("../../models/orders/invoice");

const financialReport = async (req, res) => {
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
        $match: queryObject,
      },
      {
        $unwind: "$products",
      },
      {
        $lookup: {
          from: "products",
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
          _id: null,
          totalSales: {
            $sum: {
              $multiply: ["$products.quantity", "$products.purchasedUnitPrice"],
            },
          },
          totalProductsSold: { $sum: "$products.quantity" },
          totalProfit: {
            $sum: {
              $multiply: [
                "$products.quantity",
                "$products.purchasedUnitPrice",
                { $divide: ["$productDetails.margin", 100] },
              ],
            },
          },
        },
      },
    ];
    const result = await invoiceModel.aggregate(pipeline);
    return result[0];
  } catch (err) {
    console.error(err);
    return null;
  }
};
module.exports = { financialReport };
