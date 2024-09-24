const {
  getCart,
  addToCart,
  updateCart,
  deleteCart,
  clearCart,
} = require("../../controllers/orders/cart");
const authMiddleware = require("../../middlewares/authMiddleware");

const cartRoutes = (fastify, _, done) => {
  fastify.get("/", { preHandler: authMiddleware }, getCart);
  fastify.post("/:id/:qty", { preHandler: authMiddleware }, addToCart);
  fastify.patch("/:id/:quantity", { preHandler: authMiddleware }, updateCart);
  fastify.delete("/:id", { preHandler: authMiddleware }, deleteCart);
  fastify.delete("/", { preHandler: authMiddleware }, clearCart);

  done();
};

module.exports = cartRoutes;
