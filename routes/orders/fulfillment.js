const {
  getFulfillment,
  getFulfillmentById,
  updateFulfillment,
} = require("../../controllers/orders/fulfillment");
const { shipFulfillment } = require("../../controllers/orders/shipFulfillment");
const authMiddleware = require("../../middlewares/authMiddleware");

const fulfillRoutes = (fastify, _, done) => {
  fastify.get("/", { preHandler: authMiddleware }, getFulfillment);
  fastify.get("/:id", { preHandler: authMiddleware }, getFulfillmentById);
  fastify.patch("/:id", { preHandler: authMiddleware }, updateFulfillment);
  fastify.patch("/ship/:id", { preHandler: authMiddleware }, shipFulfillment);

  done();
};
module.exports = fulfillRoutes;
