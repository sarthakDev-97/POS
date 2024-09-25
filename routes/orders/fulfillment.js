const {
  getFulfillment,
  getFulfillmentById,
} = require("../../controllers/orders/fulfillment");
const authMiddleware = require("../../middlewares/authMiddleware");

const fulfillRoutes = (fastify, _, done) => {
  fastify.get("/", { preHandler: authMiddleware }, getFulfillment);
  fastify.get("/:id", { preHandler: authMiddleware }, getFulfillmentById);

  done();
};
module.exports = fulfillRoutes;
