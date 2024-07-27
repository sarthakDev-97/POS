const { login, signup } = require("../controllers/userControllers/auth");

const authRoute = (fastify, _, done) => {
  fastify.post("/login", login);
  fastify.post("/signup", signup);

  done();
};

module.exports = authRoute;
