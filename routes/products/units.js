const authMiddleware = require("../../middlewares/authMiddleware");
const {
  getAllUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  getUnitDD,
  getUnitById,
} = require("../../controllers/productsControllers/unitsController");

const unitsRoutes = (fastify, _, done) => {
  fastify.get("/", { preHandler: authMiddleware }, getAllUnits);
  fastify.get("/:id", { preHandler: authMiddleware }, getUnitById);
  fastify.get("/dd", { preHandler: authMiddleware }, getUnitDD);
  fastify.post("/", { preHandler: authMiddleware }, createUnit);
  fastify.patch("/:id", { preHandler: authMiddleware }, updateUnit);
  fastify.delete("/:id", { preHandler: authMiddleware }, deleteUnit);
  done();
};

module.exports = unitsRoutes;
