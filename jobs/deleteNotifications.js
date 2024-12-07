const cron = require("node-cron");

const notificationModel = require("../models/notifications");

const deleteJob = () => {
  cron.schedule(
    "33 3 * * 6",
    async () => {
      try {
        const date = new Date();
        const fifteenDaysAgo = new Date(date.setDate(date.getDate() - 15));

        const notifications = await notificationModel.deleteMany({
          isRead: true,
          createdAt: { $lte: fifteenDaysAgo },
        });

        console.log(notifications);
      } catch (error) {
        console.log(error);
      }
    },
    { timezone: "Asia/Kolkata" }
  );
};

module.exports = deleteJob;
