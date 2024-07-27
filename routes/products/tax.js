const {
  getAllTax,
  createTax,
  updateTax,
  deleteTax,
  getTaxDD,
  getTaxById,
} = require("../../controllers/productsControllers/taxController");
const authMiddleware = require("../../middlewares/authMiddleware");

const taxRoutes = (fastify, _, done) => {
  fastify.get("/", { preHandler: authMiddleware }, getAllTax);
  fastify.get("/:id", { preHandler: authMiddleware }, getTaxById);
  fastify.get("/dd", { preHandler: authMiddleware }, getTaxDD);
  fastify.post("/", { preHandler: authMiddleware }, createTax);
  fastify.patch("/:id", { preHandler: authMiddleware }, updateTax);
  fastify.delete("/:id", { preHandler: authMiddleware }, deleteTax);

  done();
};

module.exports = taxRoutes;
