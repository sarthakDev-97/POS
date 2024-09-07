const {
  getAllVariation,
  createVariation,
  getVariationById,
  updateVariation,
  deleteVariation,
  getVariationByIdReal,
} = require("../../controllers/productsControllers/variationController");
const authMiddleware = require("../../middlewares/authMiddleware");

const variationRoutes = (fastify, _, done) => {
  fastify.get("/", { preHandler: authMiddleware }, getAllVariation);
  fastify.post("/", { preHandler: authMiddleware }, createVariation);
  fastify.get("/:id", { preHandler: authMiddleware }, getVariationById);
  fastify.get("/id/:id", { preHandler: authMiddleware }, getVariationByIdReal);
  fastify.patch("/:id", { preHandler: authMiddleware }, updateVariation);
  fastify.delete("/:id", { preHandler: authMiddleware }, deleteVariation);

  done();
};

module.exports = variationRoutes;
