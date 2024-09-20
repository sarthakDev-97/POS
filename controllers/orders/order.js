const { StatusCodes } = require("http-status-codes");
const orderSchema = require("../../models/orders/order");
const asyncWrapper = require("../../middlewares/async");

const getAllOrders = asyncWrapper(async (req, res) => {
  const orders = await orderSchema
    .find({ user: req.user.userId })
    .sort("-createdAt")
    .select(
      "products.quantity products.product quantity status paymentMethod paymentStatus deliveryDate totalPayable createdAt updatedAt"
    )
    .populate({
      path: "products.product",
      select:
        "name image variation unitSellingPriceHigh unitSellingPriceLow tax",
      populate: { path: "tax", select: "rate" },
      populate: { path: "variation", select: "type value" },
    })
    .lean();
  if (!orders) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "No orders found for this user." });
  }
  res
    .code(StatusCodes.OK)
    .send({ orders, msg: "Orders retrieved successfully." });
});

const getOrderById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const order = await orderSchema
    .findOne({ _id: id, user: req.user.userId })
    .populate({
      path: "products.product",
      select:
        "name image variation unitSellingPriceHigh unitSellingPriceLow tax",
      populate: { path: "tax", select: "rate" },
      populate: { path: "variation", select: "type value" },
    })
    .lean();
  if (!order) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Order not found. Please check again." });
  }
  res
    .code(StatusCodes.OK)
    .send({ order, msg: "Order retrieved successfully." });
});

const createOrder = asyncWrapper(async (req, res) => {
  const user = req.user.userId;
  const newOrder = new orderSchema(req.body);
  const products = await newOrder.populate({
    path: "products.product",
    select: "unitSellingPriceHigh unitSellingPriceLow tax",
    populate: { path: "tax", select: "rate" },
  });
  products.products.forEach((product) => {
    product.totalPrice =
      ((product.product.unitSellingPriceLow * product.product.tax.rate) / 100 +
        product.product.unitSellingPriceLow) *
      product.quantity;
    product.totalTaxes =
      ((product.product.unitSellingPriceLow * product.product.tax.rate) / 100) *
      product.quantity;
    product.withoutTax = product.totalPrice - product.product.tax.rate;
  });
  console.log(products.products);
  newOrder.user = user;
  newOrder.totalPayable =
    products.products.reduce((acc, curr) => acc + curr.totalPrice, 0) -
    newOrder.discount -
    newOrder.coupon +
    newOrder.shippingCharge;
  newOrder.totalWithoutDiscounts =
    products.products.reduce((acc, curr) => acc + curr.totalPrice, 0) +
    products.shippingCharge;
  newOrder.totalPriceWOTax = products.products.reduce(
    (acc, curr) => acc + curr.withoutTax,
    0
  );
  newOrder.quantity = products.products.reduce(
    (acc, curr) => acc + curr.quantity,
    0
  );
  newOrder.taxes = products.products.reduce(
    (acc, curr) => acc + curr.totalTaxes,
    0
  );
  const order = await newOrder.save();
  res.code(StatusCodes.CREATED).send({
    order,
    msg: "Order created successfully",
  });
});

const updateOrder = asyncWrapper(async (req, res) => {
  const order = await orderSchema.findOneAndUpdate(
    { _id: req.params.id, user: req.user.userId },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!order) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Order not found. Please check again." });
  }
  res.code(StatusCodes.OK).send({
    order,
    msg: "Order updated successfully.",
  });
});

const deleteOrder = asyncWrapper(async (req, res) => {});

const getAdminAllOrders = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const orders = await orderSchema.find().sort("-createdAt").lean();
  if (!orders) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "No orders found." });
  }
  res
    .code(StatusCodes.OK)
    .send({ orders, msg: "Orders retrieved successfully." });
});

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getAdminAllOrders,
};
