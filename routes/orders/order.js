const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} = require("../../controllers/orders/order");
const authMiddleware = require("../../middlewares/authMiddleware");

const orderRoutes = (fastify, _, done) => {
  fastify.get("/", { preHandler: authMiddleware }, getAllOrders);
  fastify.get("/:id", { preHandler: authMiddleware }, getOrderById);
  fastify.post("/", { preHandler: authMiddleware }, createOrder);
  fastify.patch("/:id", { preHandler: authMiddleware }, updateOrder);
  fastify.delete("/:id", { preHandler: authMiddleware }, deleteOrder);

  done();
};

module.exports = orderRoutes;