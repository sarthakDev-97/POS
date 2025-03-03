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
  if (req.user.typeofuser !== "admin") {
    return res
      .status(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Unauthorized access. Please login again." });
  }
  const financeGraph = await financialGraph(req, res);
  const saleGraph = await salesGraph(req, res);
  const productPerformance = await productPerformanceReport(req, res);

  const file = fs.createWriteStream(path.join(__dirname, "./", "report.csv"));
  file.write("Financial Graph\n");
  console.log(financeGraph);
  file.write(Object.keys(financeGraph[0]).join(","));
  financeGraph.forEach((elem) => {
    console.log(elem);
    file.write(`\n${Object.values(elem).join(",")}`);
  });
  file.write("\n");
  file.write("\n");
  file.write("\n");
  file.write("\nSales Graph\n");
  file.write(Object.keys(saleGraph[0]).join(","));
  saleGraph.forEach((elem) => {
    console.log(elem);
    file.write(`\n${Object.values(elem).join(",")}`);
  });

  file.write("\n");
  file.write("\n");
  file.write("\n");
  file.write("\nProduct Performance\n");
  file.write(Object.keys(productPerformance[0]).join(","));
  productPerformance.forEach((elem) => {
    console.log(elem);
    file.write(`\n${Object.values(elem).join(",").replaceAll("\n", " ")}`);
  });
  file.end();
  const stream = fs.readFileSync(path.join(__dirname, "./", "report.csv"));
  res
    .header("Content-disposition", "attachment; filename=report.csv")
    .send(stream);
});

module.exports = { getReports, getSalesGraph, getFinanceGraph, downloadReport };
