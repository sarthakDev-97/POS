const {
  getAllAddress,
  createAddress,
  getAddressById,
  updateAddress,
  deleteAddress,
} = require("../controllers/userControllers/address");
const authMiddleware = require("../middlewares/authMiddleware");

const addressRoutes = (fastify, _, done) => {
  fastify.get("/", { preHandler: authMiddleware }, getAllAddress);
  fastify.post("/", { preHandler: authMiddleware }, createAddress);
  fastify.get("/:id", { preHandler: authMiddleware }, getAddressById);
  fastify.patch("/:id", { preHandler: authMiddleware }, updateAddress);
  fastify.delete("/:id", { preHandler: authMiddleware }, deleteAddress);

  done();
};

module.exports = addressRoutes;
