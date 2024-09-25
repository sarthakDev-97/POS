const fulfillmentModel = require("../../models/orders/fulfilment");
const { StatusCodes } = require("http-status-codes");
const asyncWrapper = require("../../middlewares/async");

const getFulfillment = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser === "admin" || req.user.typeofuser === "seller") {
    return res
      .code(StatusCodes.UNAUTHORIZED)
      .send({ msg: "Unauthorized access." });
  }

  const { sort, page, result, dateFilters, status } = req.query;
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
    filters = filters.split(",").forEach((item) => {
      const [field, op, value, op2, value2] = item.split("_");

      if (options.includes(field)) {
        const fieldFilters = {
          [op]: field === "createdAt" ? new Date(value) : Number(value),
        };

        if (op2 && value2) {
          fieldFilters[op2] =
            field === "createdAt" ? new Date(value2) : Number(value2);
        }
        queryObject[field] = fieldFilters;
      }
    });
  }

  const skipItems = (currentPage - 1) * itemsPerPage;

  const orders = await fulfillmentModel
    .find(queryObject)
    .where({ status: status })
    .where(req.user.typeofuser === "seller" ? { seller: req.user._id } : {})
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
  totalData = await fulfillmentModel.countDocuments(queryObject);
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
  if (req.user.typeofuser === "admin" || req.user.typeofuser === "seller") {
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
  if (req.user.typeofuser === "admin" || req.user.typeofuser === "seller") {
    return res
      .code(StatusCodes.UNAUTHORIZED)
      .send({ msg: "Unauthorized access." });
  }
  const { id } = req.params;
  const fulfillment = await fulfillmentModel.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!fulfillment) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Fulfillment not updated. Please check again." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ fulfillment, msg: "Fulfillment updated successfully." });
});

module.exports = { getFulfillment, getFulfillmentById, updateFulfillment };