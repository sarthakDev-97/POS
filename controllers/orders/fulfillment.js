const fulfillmentModel = require("../../models/orders/fulfilment");
const { StatusCodes } = require("http-status-codes");
const asyncWrapper = require("../../middlewares/async");
const orderModel = require("../../models/orders/order");
const productModel = require("../../models/products/product");
const notificationModel = require("../../models/notifications");

const getFulfillment = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser === "user") {
    return res
      .code(StatusCodes.UNAUTHORIZED)
      .send({ msg: "Unauthorized access." });
  }

  const { sort, page, result, dateFilters, status, search } = req.query;
  const queryObject = {};
  const sortQuery = {};
  const itemsPerPage = parseInt(result) || 5;
  const currentPage = parseInt(page) || 1;

  if (sort) {
    sortQuery.sort = sort.split(",").join(" ") || "-createdAt";
  }
  if (dateFilters) {
    const opMap = {
      ">": "$gt",
      ">=": "$gte",
      "=": "$eq",
      "<": "$lt",
      "<=": "$lte",
    };

    const regEx = /\b(>|>=|=|<|<=)\b/g;
    let filters = dateFilters.replace(regEx, (match) => `_${opMap[match]}_`);

    const options = ["createdAt"];
    filters.split(",").forEach((item) => {
      const [field, op, value] = item.split("_");

      if (options.includes(field)) {
        const fieldFilters = {
          [op]: field === "createdAt" ? new Date(value) : Number(value),
        };
        if (queryObject[field] !== undefined) {
          queryObject[field] = { ...queryObject[field], ...fieldFilters };
        } else {
          queryObject[field] = fieldFilters;
        }
      }
    });
  }
  if (search) {
    // const orders = await orderModel.aggregate([
    //   { $addFields: { convId: { $toString: "$_id" } } },
    //   {
    //     $match: {
    //       convId: {
    //         $regex: `^${search}`,
    //         $options: "i",
    //       },
    //     },
    //   },
    //   { $project: { convId: 0 } },
    // ]);
    // console.log(orders);
    // queryObject.$or = [
    //   {
    //     order: orders.map((o) => {
    //       o._id, console.log(o);
    //     }),
    //   },
    // ];
  }
  if (req.user.typeofuser === "seller") {
    queryObject.seller = req.user.userId;
  }
  if (status) {
    queryObject.status = status;
  }

  const skipItems = (currentPage - 1) * itemsPerPage;

  const orders = await fulfillmentModel
    .find(queryObject)
    .sort(sortQuery.sort)
    .limit(itemsPerPage)
    .skip(skipItems)
    .populate({
      path: "productsOrdered.product",
      select: "name image variation",
      populate: { path: "variation", select: "type value" },
    })
    .lean();
  if (!orders) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "No orders found." });
  }
  totalData = await fulfillmentModel.countDocuments(queryObject).where(
    status
      ? {
          status: status,
        }
      : {}
  );
  res.code(StatusCodes.OK).send({
    orders,
    msg: "Orders retrieved successfully.",
    itemsPerPage: itemsPerPage,
    pageNo: currentPage,
    total: totalData,
    totalPages: Math.ceil((await totalData) / itemsPerPage),
  });
});

const getFulfillmentById = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser === "user") {
    return res
      .code(StatusCodes.UNAUTHORIZED)
      .send({ msg: "Unauthorized access." });
  }
  const { id } = req.params;
  const fulfillment = await fulfillmentModel
    .findById(id)
    .populate({
      path: "order",
      select:
        "user creditPoints shippingAddress status paymentMethod paymentStatus paymentDetails deliveryDate",
      populate: {
        path: "user",
        select: "name gstNumber panNumber phone email username typeofuser",
      },
      populate: {
        path: "shippingAddress",
        select: "name phone address city state country pincode",
      },
    })
    .populate({
      path: "productsOrdered.product",
      select: "name image variation",
      populate: { path: "variation", select: "type value" },
    })
    .populate({
      path: "productsSent.product",
      select: "name image variation",
      populate: { path: "variation", select: "type value" },
    })
    .populate({
      path: "seller",
      select: "name gstNumber panNumber phone email username typeofuser",
    })
    .lean();
  if (!fulfillment) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Fulfillment not found." });
  }
  res.code(StatusCodes.OK).send({ fulfillment, msg: "Fulfillment found." });
});

const updateFulfillment = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser === "user") {
    return res
      .code(StatusCodes.UNAUTHORIZED)
      .send({ msg: "Unauthorized access." });
  }
  const { id } = req.params;
  const { status, seller } = req.body;
  const { productsSent } = req.body;
  const fulfillment = await fulfillmentModel.findOneAndUpdate(
    status.toLowerCase() !== "cancelled"
      ? req.user.typeofuser === "seller"
        ? {
            _id: id,
            seller: req.user.userId,
            status: { $in: ["PENDING", "SHIPPED", "DELIVERED", "PROCESSING"] },
          }
        : {
            _id: id,
            status: { $in: ["PENDING", "SHIPPED", "DELIVERED", "PROCESSING"] },
          }
      : req.user.typeofuser === "seller"
      ? { _id: id, seller: req.user.userId }
      : { _id: id },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!fulfillment) {
    return res.code(StatusCodes.PARTIAL_CONTENT).send({
      msg: "Fulfillment not updated. Please check again.",
      note: "Status of a cancelled order cannot be changed.",
    });
  }
  if (status) {
    const order = await orderModel.findByIdAndUpdate(
      fulfillment.order,
      { status: status.toLowerCase() },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!order) {
      return res
        .code(StatusCodes.PARTIAL_CONTENT)
        .send({ msg: "Order status not updated. Please check again." });
    }
    const notify = await notificationModel.create({
      user: order.user,
      title: "Order Status Updated",
      description: `Order status has been updated to ${status.toLowerCase()} for OrderId ${
        order._id
      }.`,
      type: "fulfillment",
      for: "user",
    });
    if (!notify) {
    }
    if (order.status !== "cancelled" && status.toLowerCase() === "cancelled") {
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
      products.forEach((p) => {
        if (p.stock <= p.minStock) {
          const notify = notificationModel.create({
            user: null,
            title: "Stock Update",
            description: `Stock for ${p.name} with sku ${p.sku} has reached below ${p.minStock}.`,
            type: "stock",
            for: "admin",
          });
          if (!notify) {
          }
        }
      });
    }
  }
  if (seller) {
    const notify = await notificationModel.create({
      user: seller,
      title: "Fulfillment Updated",
      description: `Fulfillment has been updated for OrderId ${fulfillment.order}.`,
      type: "fulfillment",
      for: "seller",
    });
    if (!notify) {
    }
  }
  return res
    .code(StatusCodes.OK)
    .send({ fulfillment, msg: "Fulfillment updated successfully." });
});

module.exports = { getFulfillment, getFulfillmentById, updateFulfillment };
