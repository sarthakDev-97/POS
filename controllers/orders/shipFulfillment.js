const asyncWrapper = require("../../middlewares/async");
const { StatusCodes } = require("http-status-codes");
const fulfillmentModel = require("../../models/orders/fulfilment");
const productModel = require("../../models/products/product");

const shipFulfillment = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const fulfillment = await fulfillmentModel.findById(id);
  if (!fulfillment) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Fulfillment not found. Please check again." });
  }
  fulfillment.status = req.body?.status?.toUpperCase() || fulfillment.status;
  if (req.body?.productsSent) {
    req.body.productsSent.forEach(async (product, i) => {
      if (
        fulfillment.productsSent[i].quantity + product.quantity - 3 >=
        fulfillment.productsOrdered[i].quantity
      ) {
        return res.code(StatusCodes.PARTIAL_CONTENT).send({
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
          .code(StatusCodes.PARTIAL_CONTENT)
          .send({ msg: "Product not found. Please check again." });
      }
      console.log(fulfillment.productsSent[i]);
      fulfillment.productsSent[i].quantity += await product.quantity;
      fulfillment.productsSent[i].totalPrice +=
        (await fulfillment.productsSent[i].purchasedUnitPrice) *
        product.quantity;
      fulfillment.productsSent[i].totalTaxes +=
        (await fulfillment.productsSent[i].purchasedUnitPrice) *
        ((productData.tax?.rate || 0) / 100) *
        product.quantity;

      await fulfillment.save();
      if (!fulfillment) {
        return res
          .code(StatusCodes.PARTIAL_CONTENT)
          .send({ msg: "Fulfillment update failed. Please try again." });
      }
      productData.stock -= product.quantity;
      await productData.save();
      if (!productData) {
        return res
          .code(StatusCodes.PARTIAL_CONTENT)
          .send({ msg: "Stock update failed. Please try again." });
      }
    });
  }
  res
    .code(StatusCodes.OK)
    .send({ fulfillment, msg: "Fulfillment shipped successfully." });
});

module.exports = { shipFulfillment };
