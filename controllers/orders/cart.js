const asyncWrapper = require("../../middlewares/async");
const cartSchema = require("../../models/orders/cart");
const { StatusCodes } = require("http-status-codes");

const getCart = asyncWrapper(async (req, res) => {
  const cart = await cartSchema
    .find({ user: req.user.userId })
    .lean()
    .populate({
      path: "product",
      select:
        "unitSellingPriceLow unitSellingPriceHigh tax name image description sku category subcategory brand",
      populate: [
        { path: "tax", select: "rate" }, // Nested population
        { path: "category", select: "name" }, // Nested population
        { path: "subcategory", select: "name" }, // Nested population
        { path: "brand", select: "name" }, // Nested population
      ],
    });
  if (!cart) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Cart not found." });
  }
  const newData = cart.map((item) => {
    const { product, quantity } = item;
    const priceNoTax = product.unitSellingPriceLow * quantity;
    const priceIncTaxes =
      ((product.tax.rate / 100) * product.unitSellingPriceLow +
        product.unitSellingPriceLow) *
      quantity;
    return { ...item, priceNoTax, priceIncTaxes }; // Destructuring assignment
  });
  const totalPrice = newData.reduce((acc, curr) => {
    return acc + curr.priceIncTaxes;
  }, 0);
  const totalQuantity = newData.reduce((acc, curr) => {
    return acc + curr.quantity;
  }, 0);
  return res.status(StatusCodes.OK).send({
    cart: newData,
    totalPrice,
    totalQuantity,
    msg: "Cart retrieved successfully.",
  });
});

const addToCart = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { qty } = req.params;
  const cart = await cartSchema.create({
    user: req.user.userId,
    quantity: qty || 1,
    product: id,
  });
  if (!cart) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Cart item not Added. Please check again." });
  }
  const newData = await cart.populate({
    path: "product",
    select: "unitSellingPriceLow unitSellingPriceHigh tax",
    populate: { path: "tax", select: "rate" },
  });
  const { product, quantity } = cart;
  const priceNoTax = (await product.unitSellingPriceLow) * quantity;
  const priceIncTaxes =
    ((await (product.tax.rate / 100)) * product.unitSellingPriceLow +
      product.unitSellingPriceLow) *
    quantity;
  return res.code(StatusCodes.CREATED).send({
    cart,
    priceNoTax,
    priceIncTaxes,
    msg: "Cart created successfully.",
  });
});

const updateCart = asyncWrapper(async (req, res) => {
  const { id, quantity } = req.params;
  const cart = await cartSchema
    .findOneAndUpdate(
      { user: req.user.userId, product: id },
      { quantity },
      { new: true }
    )
    .lean();
  if (!cart) {
    return res.code(StatusCodes.PARTIAL_CONTENT).send({
      msg: "Cart item not updated. Please check again.",
    });
  }
  return res
    .code(StatusCodes.OK)
    .send({ cart, msg: "Cart updated successfully." });
});

const deleteCart = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const cart = await cartSchema.findOneAndDelete({
    user: req.user.userId,
    product: id,
  });
  if (!cart) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Cart item not deleted. Please check again." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ msg: "Cart item deleted successfully." });
});

module.exports = { getCart, addToCart, updateCart, deleteCart };
