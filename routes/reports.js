const {
  getReports,
  getSalesGraph,
  getFinanceGraph,
  downloadReport,
} = require("../controllers/reports/report");
const authMiddleware = require("../middlewares/auth");

const reportRoutes = (fastify, _, done) => {
  fastify.get("/", { preHandler: authMiddleware }, getReports);
  fastify.get("/sales", { preHandler: authMiddleware }, getSalesGraph);
  fastify.get("/finance", { preHandler: authMiddleware }, getFinanceGraph);
  fastify.get("/download", { preHandler: authMiddleware }, downloadReport);

  done();
};

module.exports = reportRoutes;
