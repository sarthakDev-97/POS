const { StatusCodes } = require("http-status-codes");
const asyncHandler = require("../../middlewares/async");
const {
  salesReport,
  salesGraph,
} = require("../../controllers/reports/salesReport");
const { productPerformanceReport } = require("./productReport");
const { financialReport, financialGraph } = require("./financialReport");
const fs = require("fs");
const path = require("path");

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

const downloadReport = asyncHandler(async (req, res) => {
  // if (req.user.typeofuser !== "admin") {
  //   return res
  //     .status(StatusCodes.PARTIAL_CONTENT)
  //     .send({ msg: "Unauthorized access. Please login again." });
  // }
  const financeGraph = await financialGraph(req, res);
  const saleGraph = await salesGraph(req, res);
  const productPerformance = await productPerformanceReport(req, res);

  path.join(__dirname, "./", "report.csv");
  const file = fs.createWriteStream(path.join(__dirname, "./", "report.csv"));
  file.write("Financial Graph\n");
  file.write(Object.keys(financeGraph[0]).join(","));
  financeGraph.forEach((elem) => {
    console.log(elem);
    file.write(`\n${Object.values(elem).join(",")}\n`);
  });
  file.write("\nSales Graph\n");
  file.write(saleGraph);
  file.write("\nProduct Performance\n");
  file.write(productPerformance);
  file.end();
  res.download(path.join(__dirname, "./", "report.csv"), (err) => {
    if (err) {
      console.log(err);
    }
  });
});

module.exports = { getReports, getSalesGraph, getFinanceGraph, downloadReport };
