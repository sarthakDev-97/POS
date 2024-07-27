const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllDDCategories,
  getAllCategoriesWithSub,
  getCategoryById,
} = require("../../controllers/productsControllers/categoryController");
const authMiddleware = require("../../middlewares/authMiddleware");

const categoryRoutes = (fastify, _, done) => {
  fastify.get("/", { preHandler: authMiddleware }, getAllCategories);
  fastify.post("/", { preHandler: authMiddleware }, createCategory);
  fastify.get("/sub", { preHandler: authMiddleware }, getAllCategoriesWithSub);
  fastify.get("/dd", { preHandler: authMiddleware }, getAllDDCategories);
  fastify.get("/:id", { preHandler: authMiddleware }, getCategoryById);
  fastify.patch("/:id", { preHandler: authMiddleware }, updateCategory);
  fastify.delete("/:id", { preHandler: authMiddleware }, deleteCategory);

  done();
};

module.exports = categoryRoutes;
