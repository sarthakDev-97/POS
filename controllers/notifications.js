const asyncWrapper = require("../middlewares/async");
const notificationModel = require("../models/notifications");
const { StatusCodes } = require("http-status-codes");

const getAdminNotifications = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "You are not authorized to perform this action." });
  }
  const notifications = await notificationModel
    .find({ for: "admin" })
    .select("-__v -user -updatedAt -for")
    .sort("isRead -createdAt")
    .limit(100)
    .lean();
  if (!notifications) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Notifications not found. Please check again." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ notifications, msg: "Notifications retrieved successfully." });
});

const getMyNotifications = asyncWrapper(async (req, res) => {
  const notifications = await notificationModel
    .find({ user: req.user.userId })
    .select("-__v -user -updatedAt -for")
    .sort("isRead -createdAt")
    .limit(100)
    .lean();
  if (!notifications) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Notifications not found. Please check again." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ notifications, msg: "Notifications retrieved successfully." });
});

const markAsRead = asyncWrapper(async (req, res) => {
  const { id } = await req.params;
  const notification = await notificationModel
    .findByIdAndUpdate(id, { isRead: true })
    .select("-__v -user -updatedAt -for")
    .lean();
  if (!notification) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Notification not found. Please check again." });
  }
  return res.code(StatusCodes.OK).send({ msg: "Notification marked as read." });
});

module.exports = { getAdminNotifications, getMyNotifications, markAsRead };
