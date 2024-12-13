const { StatusCodes } = require("http-status-codes");
const orderSchema = require("../../models/orders/order");
const fulfillmentModel = require("../../models/orders/fulfilment");
const userSchema = require("../../models/user");
const asyncWrapper = require("../../middlewares/async");
const productModel = require("../../models/products/product");
const favouriteModel = require("../../models/orders/favourite");
const notificationModel = require("../../models/notifications");

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
  let products = await newOrder.populate({
    path: "products.product",
    select: "unitSellingPriceHigh unitSellingPriceLow tax stock",
    populate: { path: "tax", select: "rate" },
  });
  products.products.forEach(async (product) => {
    product.totalPrice =
      ((product.product.unitSellingPriceLow * product.product.tax.rate) / 100 +
        product.product.unitSellingPriceLow) *
      product.quantity;
    product.totalTaxes =
      ((product.product.unitSellingPriceLow *
        (product.product?.tax?.rate || 0)) /
        100) *
      product.quantity;
    product.withoutTax = product.totalPrice - product.totalTaxes;
    // const stockUpdate = await productModel.findByIdAndUpdate(
    //   product.product._id,
    //   {
    //     stock: product.product.stock - product.quantity,
    //   }
    // );
    // if (!stockUpdate) {
    //   return res
    //     .code(StatusCodes.PARTIAL_CONTENT)
    //     .send({ msg: "Stock update failed. Please try again." });
    // }
  });
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
  if (!order) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Order not created. Please try again." });
  }
  const seller = await userSchema
    .findOne({ typeofuser: "seller" })
    .select("_id");
  const prods = products.products.map((product) => {
    return {
      product: product.product._id,
      quantity: product.quantity,
      totalTaxes: product.totalTaxes,
      totalPrice: product.totalPrice,
      purchasedUnitPrice: product.product.unitSellingPriceLow,
    };
  });
  const prods2 = products.products.map((product) => {
    return {
      product: product.product._id,
      quantity: 0,
      totalTaxes: 0,
      totalPrice: 0,
      purchasedUnitPrice: product.product.unitSellingPriceLow,
    };
  });
  const newFulfillment = await fulfillmentModel.create({
    order: order._id,
    seller: seller._id,
    productsOrdered: prods,
    productsSent: prods2,
    discount: newOrder.discount,
    coupon: newOrder.coupon,
    shippingCharge: newOrder.shippingCharge,
    totalPayable: newOrder.totalPayable,
    totalWithoutDiscounts: newOrder.totalWithoutDiscounts,
    totalTaxes: newOrder.taxes,
    totalWOTaxes: newOrder.totalPriceWOTax,
  });
  if (!newFulfillment) {
    await orderSchema.findOneAndDelete({ _id: order._id });
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Order not created. Please try again." });
  }
  try {
    await Promise.all(
      products.products.map(async (product) => {
        const exists = await favouriteModel.findOne({
          user: req.user.userId,
          product: product.product._id,
        });
        if (!exists) {
          await favouriteModel.create({
            user: req.user.userId,
            product: product.product._id,
          });
        }
      })
    );
  } catch (error) {
    console.log(error);
  }
  const createNoti = await notificationModel.insertMany([
    {
      user: req.user.userId,
      title: "Order Placed",
      description: `Order with id ${order._id} has been placed successfully.`,
      type: "order",
      for: "user",
    },
    {
      user: seller._id,
      title: "Order Placed",
      description: `Received a new order with id ${order._id}.`,
      type: "order",
      for: "seller",
    },
    {
      user: null,
      title: "Order Placed",
      description: `Received a new order with id ${order._id}.`,
      type: "order",
      for: "admin",
    },
  ]);
  if (!createNoti) {
  }
  res.code(StatusCodes.CREATED).send({
    order,
    msg: "Order created successfully",
  });
});

const updateOrder = asyncWrapper(async (req, res) => {
  var order;
  if (req.user.typeofuser === "admin") {
    order = await orderSchema.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
  } else {
    order = await orderSchema.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
  }
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

const cancelOrder = asyncWrapper(async (req, res) => {
  const validateOrder = await orderSchema.findOne({
    _id: req.params.id,
    user: req.user.userId,
    status: "Pending",
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  if (!validateOrder) {
    return res.code(StatusCodes.PARTIAL_CONTENT).send({
      msg: "Order not found or cannot be cancelled after 24hrs of ordering. Please contact customer support.",
    });
  }
  const order = await orderSchema.findOneAndUpdate(
    { _id: req.params.id, user: req.user.userId },
    { status: "Cancelled" },
    { new: true, runValidators: true }
  );
  if (!order) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Order not found. Please check again." });
  }
  const fulfillment = await fulfillmentModel.findOneAndUpdate(
    { order: order._id },
    {
      status: "Cancelled",
    }
  );
  if (!fulfillment) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Fulfillment not found. Please check again." });
  }
  const products = await Promise.all(
    fulfillment.productsOrdered.map((p) =>
      productModel.findByIdAndUpdate(
        p.product,
        { $inc: { stock: p.quantity } },
        { new: true }
      )
    )
  );
  if (!products) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Stock update failed. Please try again." });
  }
  const notify = await notificationModel.insertMany([
    {
      user: null,
      title: "Order Cancelled",
      description: `Order with id ${order._id} has been cancelled.`,
      type: "order",
      for: "admin",
    },
    {
      user: order.seller,
      title: "Order Cancelled",
      description: `Order with id ${order._id} has been cancelled.`,
      type: "order",
      for: "seller",
    },
  ]);
  if (!notify) {
  }
  res.code(StatusCodes.OK).send({
    order,
    msg: "Order cancelled successfully.",
  });
});

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
  cancelOrder,
  getAdminAllOrders,
};
