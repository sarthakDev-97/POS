const { getReports } = require("../controllers/reports/report");
const authMiddleware = require("../middlewares/auth");

const reportRoutes = (fastify, _, done) => {
  fastify.get("/", { preHandler: authMiddleware }, getReports);

  done();
};

module.exports = reportRoutes;
