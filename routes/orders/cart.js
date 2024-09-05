const {
  getCart,
  addToCart,
  updateCart,
  deleteCart,
} = require("../../controllers/orders/cart");
const authMiddleware = require("../../middlewares/authMiddleware");

const cartRoutes = (fastify, _, done) => {
  fastify.get("/", { preHandler: authMiddleware }, getCart);
  fastify.post("/:id/:qty", { preHandler: authMiddleware }, addToCart);
  fastify.patch("/:id/:quantity", { preHandler: authMiddleware }, updateCart);
  fastify.delete("/:id", { preHandler: authMiddleware }, deleteCart);

  done();
};

module.exports = cartRoutes;
