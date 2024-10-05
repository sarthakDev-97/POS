const {
  updateBanner,
  createBanner,
  deleteBanner,
  getAllBanners,
} = require("../controllers/banner");
const authMiddleware = require("../middlewares/auth");

const bannerRoutes = (fastify, _, done) => {
  fastify.get("/", getAllBanners);
  fastify.post("/", { preHandler: authMiddleware }, createBanner);
  fastify.patch("/:id", { preHandler: authMiddleware }, updateBanner);
  fastify.delete("/:id", { preHandler: authMiddleware }, deleteBanner);

  done();
};

module.exports = bannerRoutes;
