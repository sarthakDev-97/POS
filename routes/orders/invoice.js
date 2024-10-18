const authMiddleware = require("../../middlewares/auth");
const {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceDataById,
} = require("../../controllers/orders/invoice");

const invoiceRoutes = (fastify, _, done) => {
  fastify.get(
    "/getbyorderid/:id",
    { preHandler: authMiddleware },
    getAllInvoices
  );
  fastify.get(
    "/getdata/:id",
    { preHandler: authMiddleware },
    getInvoiceDataById
  );
  fastify.post("/", { preHandler: authMiddleware }, createInvoice);
  fastify.get("/:id", getInvoiceById);
  fastify.patch("/:id", { preHandler: authMiddleware }, updateInvoice);
  fastify.delete("/:id", { preHandler: authMiddleware }, deleteInvoice);

  done();
};

module.exports = invoiceRoutes;
