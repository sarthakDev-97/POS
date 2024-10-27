const {
  getAdminNotifications,
  getMyNotifications,
  markAsRead,
} = require("../controllers/notifications");
const authMiddleware = require("../middlewares/auth");

const notifyRoutes = (fastify, _, done) => {
  fastify.get("/", { preHandler: authMiddleware }, getAdminNotifications);
  fastify.get("/user", { preHandler: authMiddleware }, getMyNotifications);
  fastify.patch("/:id", { preHandler: authMiddleware }, markAsRead);

  done();
};

module.exports = notifyRoutes;
