const { searchResult } = require("../../controllers/common");
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addMultipleProducts,
} = require("../../controllers/productsControllers/ProductPart/productController");
const authMiddleware = require("../../middlewares/authMiddleware");
const authMiddleware2 = require("../../middlewares/auth");

const productRoutes = (fastify, _, done) => {
  fastify.get("/", getAllProducts);
  fastify.get("/search", searchResult);
  fastify.get("/:id", { preHandler: authMiddleware2 }, getProductById);
  fastify.post("/", { preHandler: authMiddleware }, createProduct);
  fastify.post(
    "/multiple",
    { preHandler: authMiddleware },
    addMultipleProducts
  );
  fastify.patch("/:id", { preHandler: authMiddleware }, updateProduct);
  fastify.delete("/:id", { preHandler: authMiddleware }, deleteProduct);
  done();
};

module.exports = productRoutes;
