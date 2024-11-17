const { StatusCodes } = require("http-status-codes");
const asyncHandler = require("../../middlewares/async");
const {
  salesReport,
  salesGraph,
} = require("../../controllers/reports/salesReport");
const { productPerformanceReport } = require("./productReport");
const { financialReport, financialGraph } = require("./financialReport");

const getReports = asyncHandler(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .status(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Unauthorized access. Please login again." });
  }
  const saleReport = await salesReport(req, res);
  const productReport = await productPerformanceReport(req, res);
  const financialReports = await financialReport(req, res);

  res.status(StatusCodes.OK).send({
    salesReport: saleReport,
    productReport,
    financialReports,
  });
});

const getSalesGraph = asyncHandler(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .status(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Unauthorized access. Please login again." });
  }
  const saleGraph = await salesGraph(req, res);
  const saleReport = await salesReport(req, res);

  res.status(StatusCodes.OK).send({ saleGraph, saleReport });
});

const getFinanceGraph = asyncHandler(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .status(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Unauthorized access. Please login again." });
  }
  const financeGraph = await financialGraph(req, res);
  const financialReports = await financialReport(req, res);

  res.status(StatusCodes.OK).send({ financeGraph, financialReports });
});

module.exports = { getReports, getSalesGraph, getFinanceGraph };
