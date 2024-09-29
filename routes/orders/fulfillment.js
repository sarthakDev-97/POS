const {
  getFulfillment,
  getFulfillmentById,
  updateFulfillment,
} = require("../../controllers/orders/fulfillment");
const authMiddleware = require("../../middlewares/authMiddleware");

const fulfillRoutes = (fastify, _, done) => {
  fastify.get("/", { preHandler: authMiddleware }, getFulfillment);
  fastify.get("/:id", { preHandler: authMiddleware }, getFulfillmentById);
  fastify.patch("/:id", { preHandler: authMiddleware }, updateFulfillment);

  done();
};
module.exports = fulfillRoutes;
