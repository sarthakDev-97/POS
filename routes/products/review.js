const {
  createReview,
  updateReview,
  deleteReview,
  getAllReviews,
} = require("../../controllers/productsControllers/review");
const authMiddleware = require("../../middlewares/authMiddleware");

const reviewRoute = (fastify, _, done) => {
  fastify.get("/:id", getAllReviews);
  fastify.post("/:id", { preHandler: authMiddleware }, createReview);
  fastify.patch("/:id", { preHandler: authMiddleware }, updateReview);
  fastify.delete("/:id", { preHandler: authMiddleware }, deleteReview);

  done();
};

module.exports = reviewRoute;
