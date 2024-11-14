const { StatusCodes } = require("http-status-codes");
const asyncHandler = require("../../middlewares/async");
const { salesReport } = require("../../controllers/reports/salesReport");
const { productPerformanceReport } = require("./productReport");
const { financialReport } = require("./financialReport");

const getReports = asyncHandler(async (req, res) => {
  const saleReport = await salesReport(req, res);
  const productReport = await productPerformanceReport(req, res);
  const financialReports = await financialReport(req, res);

  res
    .status(StatusCodes.OK)
    .send({ salesReport: saleReport, productReport, financialReports });
});

module.exports = { getReports };
