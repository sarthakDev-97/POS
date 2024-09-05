const {
  removeFavourite,
  addFavourite,
  getAllFavourites,
} = require("../../controllers/orders/favourite");
const authMiddleware = require("../../middlewares/authMiddleware");

const favouriteRoutes = (fastify, _, done) => {
  fastify.get("/", { preHandler: authMiddleware }, getAllFavourites);
  fastify.post("/:id", { preHandler: authMiddleware }, addFavourite);
  fastify.delete("/:id", { preHandler: authMiddleware }, removeFavourite);

  done();
};

module.exports = favouriteRoutes;
