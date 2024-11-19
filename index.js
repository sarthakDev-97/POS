require("dotenv").config();

const fastify = require("fastify");
const app = fastify();
const cluster = require("node:cluster");
const fulfillRoutes = require("./routes/orders/fulfillment");

if (cluster.isPrimary) {
  const cpuNum = require("node:os").cpus().length;
  console.log(cpuNum);

  for (let i = 0; i < cpuNum; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  const connectDB = require("./db/connection");
  const { uploadFunc, multer } = require("./routes/fileUpload");
  // const cronJob = require("./controllers/cronDelete");
  const notFound = require("./middlewares/notFound");
  const errHandler = require("./middlewares/errHandler");
  const resizeMiddleware = require("./middlewares/resizeImage");
  const authRoute = require("./routes/auth");
  const { adminRoutes, usersRoutes } = require("./routes/users");
  const categoryRoutes = require("./routes/products/category");
  const unitsRoutes = require("./routes/products/units");
  const brandsRoutes = require("./routes/products/brands");
  const productRoutes = require("./routes/products/products");
  const subcategoryRoutes = require("./routes/products/subcategory");
  const taxRoutes = require("./routes/products/tax");
  const variationRoutes = require("./routes/products/variation");
  const addressRoutes = require("./routes/address");
  const favouriteRoutes = require("./routes/orders/favourites");
  const cartRoutes = require("./routes/orders/cart");
  const orderRoutes = require("./routes/orders/order");
  const reviewRoutes = require("./routes/products/review");
  const bannerRoutes = require("./routes/banner");
  const invoiceRoutes = require("./routes/orders/invoice");
  const notifyRoutes = require("./routes/notifications");
  const reportRoutes = require("./routes/reports");

  app.register(multer.contentParser);
  app.register(require("@fastify/cors"), {
    origin: "*", // Replace with the actual URLs of your websites
  });

  app.register(resizeMiddleware, { prefix: "/api/v1/uploads" });
  app.register(uploadFunc, { prefix: "/api/v1/files" });

  app.get("/", (req, res) => {
    console.log(`hello from server ${process.pid}`);
    res.send(`hello from server ${process.pid}`);
  });

  app.register(authRoute, { prefix: "/api/v1/auth" }); //done on APIDOG
  app.register(adminRoutes, { prefix: "/api/v1/admin" }); //done on APIDOG
  app.register(usersRoutes, { prefix: "/api/v1/user" }); //done on APIDOG
  app.register(addressRoutes, { prefix: "/api/v1/address" }); //done on APIDOG
  app.register(productRoutes, { prefix: "/api/v1/products" }); //done on APIDOG
  app.register(categoryRoutes, { prefix: "/api/v1/products/category" }); //done on APIDOG
  app.register(subcategoryRoutes, { prefix: "/api/v1/products/subcategory" }); //done on APIDOG
  app.register(unitsRoutes, { prefix: "/api/v1/products/units" }); //done on APIDOG
  app.register(brandsRoutes, { prefix: "/api/v1/products/brands" }); //done on APIDOG
  app.register(taxRoutes, { prefix: "/api/v1/products/tax" }); //done on APIDOG
  app.register(variationRoutes, { prefix: "/api/v1/products/variation" }); //done on APIDOG
  app.register(reviewRoutes, { prefix: "/api/v1/product/review" }); //done on APIDOG
  app.register(favouriteRoutes, { prefix: "/api/v1/orders/favourites" }); //done on APIDOG
  app.register(cartRoutes, { prefix: "/api/v1/orders/cart" }); //done on APIDOG
  app.register(orderRoutes, { prefix: "/api/v1/orders" }); //done on APIDOG
  app.register(fulfillRoutes, { prefix: "/api/v1/fulfillment" }); //done on APIDOG
  app.register(bannerRoutes, { prefix: "/api/v1/banner" }); //done on APIDOG
  app.register(invoiceRoutes, { prefix: "/api/v1/invoice" }); //done on APIDOG
  app.register(notifyRoutes, { prefix: "/api/v1/notifications" }); //done on APIDOG
  app.register(reportRoutes, { prefix: "/api/v1/reports" }); //done on APIDOG

  app.setNotFoundHandler(notFound);
  app.setErrorHandler(errHandler);

  const start = async () => {
    try {
      await connectDB(process.env.CONSTR3);
      app.listen({
        port: process.env.PORT || 4000,
        host: process.env.HOST || "localhost",
      });
      console.log(
        `Server listening on ${app.server.address().address}:${
          app.server.address().port
        } at process ${process.pid}`
      );
    } catch (err) {
      app.log.error(err);
    }
  };

  start();
}
