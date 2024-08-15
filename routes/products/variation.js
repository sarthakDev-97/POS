const {
  getAllVariation,
  createVariation,
  getVariationById,
  updateVariation,
  deleteVariation,
} = require("../../controllers/productsControllers/variationController");
const authMiddleware = require("../../middlewares/authMiddleware");

const variationRoutes = (fastify, _, done) => {
  fastify.get("/", { preHandler: authMiddleware }, getAllVariation);
  fastify.post("/", { preHandler: authMiddleware }, createVariation);
  fastify.get("/:id", { preHandler: authMiddleware }, getVariationById);
  fastify.patch("/:id", { preHandler: authMiddleware }, updateVariation);
  fastify.delete("/:id", { preHandler: authMiddleware }, deleteVariation);

  done();
};

module.exports = variationRoutes;
