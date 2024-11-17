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

const salesGraph = async (req, res) => {
  try {
    const { dateFilters } = req.query;
    const queryObject = {};

    // Build query based on date filters
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
          queryObject.date = queryObject.date
            ? { ...queryObject.date, ...fieldFilters }
            : fieldFilters;
        }
      });
    }

    // Define aggregation pipeline
    const pipeline = determineBuckets(dateFilters);

    // Function to determine buckets based on date range
    function determineBuckets(dateFilters) {
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
            $group: {
              _id: {
                year: { $year: "$date" },
                month: { $month: "$date" },
                day: { $dayOfMonth: "$date" }, // For daily granularity
              },
              totalSales: { $sum: "$totalPayable" },
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
                  "-",
                  {
                    $cond: [
                      { $gte: ["$_id.day", 10] },
                      { $toString: "$_id.day" },
                      { $concat: ["0", { $toString: "$_id.day" }] },
                    ],
                  },
                ],
              },
              data: "$totalSales",
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
            $group: {
              _id: {
                year: { $year: "$date" },
                month: { $month: "$date" },
              },
              totalSales: { $sum: "$totalPayable" },
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
              data: "$totalSales",
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
            $group: {
              _id: {
                year: { $year: "$date" },
                month: { $month: "$date" },
              },
              totalSales: { $sum: "$totalPayable" },
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
              data: "$totalSales",
            },
          },
          {
            $sort: { _id: 1 },
          },
        ]; // For more than a year, consider weekly buckets
      }
    }

    const result = await invoiceModel.aggregate(pipeline);
    if (result.length === 0) {
      return null;
    }

    const graphData = result.map((data) => ({
      label: data.label,
      data: parseFloat(data.data.toFixed(2)),
    }));

    return graphData;
  } catch (error) {
    console.error(error);
    return null;
  }
};

module.exports = { salesReport, salesGraph };
