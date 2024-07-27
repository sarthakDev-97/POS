const {
  getAllUsers,
  getUserById,
  patchUserById,
  patchAll,
  updateUserById,
} = require("../controllers/userControllers/adminControllers");
const {
  getUser,
  patchUser,
  deleteUser,
} = require("../controllers/userControllers/userControllers");
const authMiddleware = require("../middlewares/authMiddleware");

const usersRoutes = (fastify, _, done) => {
  fastify.get("/", { preHandler: authMiddleware }, getUser);
  fastify.patch("/", { preHandler: authMiddleware }, patchUser);
  fastify.delete("/", { preHandler: authMiddleware }, deleteUser);

  done();
};

const adminRoutes = (fastify, _, done) => {
  fastify.get(
    "/getall",
    {
      preHandler: authMiddleware,
    },
    getAllUsers
  );
  fastify.get("/:id", { preHandler: authMiddleware }, getUserById);
  fastify.patch("/:id", { preHandler: authMiddleware }, patchUserById);
  fastify.patch("/update/:id", { preHandler: authMiddleware }, updateUserById);
  fastify.patch("/patchall", { preHandler: authMiddleware }, patchAll);

  done();
};

module.exports = { usersRoutes, adminRoutes };
