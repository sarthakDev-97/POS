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

const financialGraph = async (req, res) => {
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

    const pipeline = determineDate(dateFilters);

    function determineDate(dateFilters) {
      const [startDate, endDate] = dateFilters.split(",");

      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      const dateDiffInDays = Math.ceil(
        (endDateObj - startDateObj) / (1000 * 60 * 60 * 24)
      );

      // Adjust the number of buckets based on the date range
      if (dateDiffInDays <= 150) {
        // Approximately a month
        return [
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
              _id: "$date", // Group by date
              totalSales: {
                $sum: {
                  $multiply: [
                    "$products.quantity",
                    "$products.purchasedUnitPrice",
                  ],
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
          {
            $project: {
              label: { $dateToString: { format: "%Y-%m-%d", date: "$_id" } },
              totalProfit: "$totalProfit",
              totalProductsSold: "$totalProductsSold",
              totalSales: "$totalSales",
            },
          },
          {
            $sort: { _id: 1 },
          },
        ];
      } else if (dateDiffInDays <= 365) {
        // Approximately a year
        return [
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
              _id: {
                year: { $year: "$date" },
                month: { $month: "$date" },
              },
              totalSales: {
                $sum: {
                  $multiply: [
                    "$products.quantity",
                    "$products.purchasedUnitPrice",
                  ],
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
          {
            $project: {
              label: {
                $concat: [
                  { $toString: "$_id.year" },
                  "-",
                  {
                    $cond: [
                      { $gte: ["$_id.month", 10] },
                      { $toString: "$_id.month" },
                      { $concat: ["0", { $toString: "$_id.month" }] },
                    ],
                  },
                ],
              },
              totalSales: "$totalSales",
              totalProductsSold: "$totalProductsSold",
              totalProfit: "$totalProfit",
            },
          },
          {
            $sort: { _id: 1 },
          },
        ];
      } else {
        // Handle larger date ranges as needed
        return [
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
              _id: {
                year: { $year: "$date" },
                month: { $month: "$date" },
              },
              totalSales: {
                $sum: {
                  $multiply: [
                    "$products.quantity",
                    "$products.purchasedUnitPrice",
                  ],
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
          {
            $project: {
              label: {
                $concat: [
                  { $toString: "$_id.year" },
                  "-",
                  {
                    $cond: [
                      { $gte: ["$_id.month", 10] },
                      { $toString: "$_id.month" },
                      { $concat: ["0", { $toString: "$_id.month" }] },
                    ],
                  },
                ],
              },
              totalSales: "$totalSales",
              totalProductsSold: "$totalProductsSold",
              totalProfit: "$totalProfit",
            },
          },
          {
            $sort: { _id: 1 },
          },
        ];
      }
    }

    const result = await invoiceModel.aggregate(pipeline);
    return result.map((item) => {
      item._id = undefined;
      return item;
    });
  } catch (e) {
    console.error(e);
    return null;
  }
};

module.exports = { financialReport, financialGraph };
