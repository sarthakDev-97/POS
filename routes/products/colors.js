const authMiddleware = require("../../middlewares/authMiddleware");
const {
  getAllColors,
  createColor,
  getColorsByID,
  updateColor,
  deleteColor,
} = require("../../controllers/productsControllers/colorsController");

const colorRoutes = (fastify, _, done) => {
  fastify.get("/", { preHandler: authMiddleware }, getAllColors);
  fastify.post("/", { preHandler: authMiddleware }, createColor);
  fastify.get("/:id", { preHandler: authMiddleware }, getColorsByID);
  fastify.patch("/:id", { preHandler: authMiddleware }, updateColor);
  fastify.delete("/:id", { preHandler: authMiddleware }, deleteColor);
  done();
};

module.exports = colorRoutes;
