const {
  getSubcategory,
  updateSubcategory,
  deleteSubcategory,
  addSubcategory,
  getAllSubcategory,
} = require("../../controllers/productsControllers/subcategoryController");
const authMiddleware = require("../../middlewares/authMiddleware");

const subcategoryRoutes = (fastify, _, done) => {
  fastify.get("/:id", { preHandler: authMiddleware }, getSubcategory);
  fastify.get("/getAll/:id", { preHandler: authMiddleware }, getAllSubcategory);
  fastify.post("/", { preHandler: authMiddleware }, addSubcategory);
  fastify.patch("/:id", { preHandler: authMiddleware }, updateSubcategory);
  fastify.delete("/:id", { preHandler: authMiddleware }, deleteSubcategory);

  done();
};

module.exports = subcategoryRoutes;
