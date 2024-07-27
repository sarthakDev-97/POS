const authMiddleware = require("../../middlewares/authMiddleware");
const {
  getAllBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  getBrandDD,
  getBrandById,
} = require("../../controllers/productsControllers/brandsController");

const brandsRoutes = (fastify, _, done) => {
  fastify.get("/", { preHandler: authMiddleware }, getAllBrands);
  fastify.get("/dd", { preHandler: authMiddleware }, getBrandDD);
  fastify.get("/:id", { preHandler: authMiddleware }, getBrandById);
  fastify.post("/", { preHandler: authMiddleware }, createBrand);
  fastify.patch("/:id", { preHandler: authMiddleware }, updateBrand);
  fastify.delete("/:id", { preHandler: authMiddleware }, deleteBrand);

  done();
};

module.exports = brandsRoutes;
