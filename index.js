require("dotenv").config();

const fastify = require("fastify");
const app = fastify();

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

app.register(multer.contentParser);
// app.then(test);
app.register(require("@fastify/cors"), {
  origin: "*", // Replace with the actual URLs of your websites
});

app.register(resizeMiddleware, { prefix: "/api/v1/uploads" });
app.register(uploadFunc, { prefix: "/api/v1/files" });

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
app.register(favouriteRoutes, { prefix: "/api/v1/orders/favourites" }); //done on APIDOG
app.register(cartRoutes, { prefix: "/api/v1/orders/cart" }); //done on APIDOG
app.register(orderRoutes, { prefix: "/api/v1/orders" });

app.setNotFoundHandler(notFound);
app.setErrorHandler(errHandler);

const start = async () => {
  try {
    await connectDB(process.env.CONSTR2);
    await app.listen({
      port: process.env.PORT || 3000,
      host: process.env.HOST ? `${process.env.HOST}` : "localhost",
    });
    console.log(
      `Server listening on ${app.server.address().address}:${
        app.server.address().port
      }`
    );
  } catch (err) {
    app.log.error(err);
  }
};

start();
