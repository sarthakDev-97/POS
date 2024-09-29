const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  cancelOrder,
  getAdminAllOrders,
} = require("../../controllers/orders/order");
const authMiddleware = require("../../middlewares/authMiddleware");

const orderRoutes = (fastify, _, done) => {
  fastify.get(
    "/getAllAdmin",
    { preHandler: authMiddleware },
    getAdminAllOrders
  );
  fastify.get("/", { preHandler: authMiddleware }, getAllOrders);
  fastify.get("/:id", { preHandler: authMiddleware }, getOrderById);
  fastify.post("/", { preHandler: authMiddleware }, createOrder);
  fastify.patch("/:id", { preHandler: authMiddleware }, updateOrder);
  fastify.patch("/cancel/:id", { preHandler: authMiddleware }, cancelOrder);

  done();
};

module.exports = orderRoutes;
