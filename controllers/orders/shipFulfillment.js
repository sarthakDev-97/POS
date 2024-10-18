const asyncWrapper = require("../../middlewares/async");
const { StatusCodes } = require("http-status-codes");
const fulfillmentModel = require("../../models/orders/fulfilment");
const productModel = require("../../models/products/product");
const invoiceModel = require("../../models/orders/invoice");
const orderModel = require("../../models/orders/order");

const shipFulfillment = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const fulfillment = await fulfillmentModel.findById(id);
  if (!fulfillment) {
    return res
      .status(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Fulfillment not found. Please check again." });
  }
  let totalPayable = 0;
  let totalTaxes = 0;
  fulfillment.status = req.body?.status?.toUpperCase() || fulfillment.status;
  if (req.body?.productsSent) {
    for (let i = 0; i < req.body.productsSent.length; i++) {
      const product = req.body.productsSent[i];
      if (
        fulfillment.productsSent[i].quantity + product.quantity - 3 ===
        fulfillment.productsOrdered[i].quantity
      ) {
        return res.status(StatusCodes.PARTIAL_CONTENT).send({
          for: product.product,
          msg: "The quantity sent cannot be greater than the quantity ordered. Quantity of 3 is Ignorable.",
        });
      }
      const productData = await productModel
        .findById(product.product)
        .select("tax stock")
        .populate("tax", "rate");
      if (!productData) {
        return res
          .status(StatusCodes.PARTIAL_CONTENT)
          .send({ msg: "Product not found. Please check again." });
      }
      fulfillment.productsSent[i].quantity += product.quantity;
      fulfillment.productsSent[i].totalPrice +=
        fulfillment.productsSent[i].purchasedUnitPrice * product.quantity;
      fulfillment.productsSent[i].totalTaxes +=
        fulfillment.productsSent[i].purchasedUnitPrice *
        ((productData.tax?.rate || 0) / 100) *
        product.quantity;

      req.body.productsSent[i].totalTaxes = 0;
      req.body.productsSent[i].totalTaxes +=
        fulfillment.productsSent[i].purchasedUnitPrice *
        ((productData.tax?.rate || 0) / 100) *
        product.quantity;
      fulfillment.totalPayable += fulfillment.productsSent[i].totalPrice;
      fulfillment.totalTaxes += fulfillment.productsSent[i].totalTaxes;
      totalTaxes +=
        fulfillment.productsSent[i].purchasedUnitPrice *
        ((productData.tax?.rate || 0) / 100) *
        product.quantity;
      totalPayable +=
        fulfillment.productsSent[i].purchasedUnitPrice * product.quantity;
      fulfillment.totalWOTaxes +=
        fulfillment.productsSent[i].purchasedUnitPrice *
        fulfillment.productsSent[i].quantity;

      await fulfillment.save({ new: true });
      if (!fulfillment) {
        return res
          .status(StatusCodes.PARTIAL_CONTENT)
          .send({ msg: "Fulfillment update failed. Please try again." });
      }
      productData.stock -= product.quantity;
      await productData.save();
      if (!productData) {
        return res
          .status(StatusCodes.PARTIAL_CONTENT)
          .send({ msg: "Stock update failed. Please try again." });
      }
    }
  }
  console.log(req.body.productsSent);
  const user = await orderModel
    .findById(fulfillment.order)
    .select("user shippingAddress");
  if (!user) {
    return res
      .status(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "User not found. Please check again." });
  }

  const invoiceProds = req.body.productsSent.map((product, ind) => ({
    product: product.product,
    quantity: product.quantity,
    purchasedUnitPrice: fulfillment.productsSent[ind].purchasedUnitPrice,
    totalTaxes: product.totalTaxes,
  }));
  const invoice = await invoiceModel.create({
    order: fulfillment.order,
    seller: fulfillment.seller,
    user: user.user,
    address: user.shippingAddress,
    products: invoiceProds.filter((elem) => elem.quantity > 0),
    totalPayable: totalPayable + totalTaxes,
    totalTaxes: totalTaxes,
    date: fulfillment.createdAt,
    packagingCharges: { amount: fulfillment.shippingCharge },
  });
  if (!invoice) {
    return res
      .status(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Invoice creation failed. Please try again." });
  }
  res
    .status(StatusCodes.OK)
    .send({ fulfillment, msg: "Fulfillment shipped successfully." });
});

module.exports = { shipFulfillment };
