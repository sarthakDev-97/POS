const { StatusCodes } = require("http-status-codes");
const asyncWrapper = require("../../middlewares/async");

const getCreditMoney = asyncWrapper(async (req, res) => {});
const addCreditMoney = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin" || req.user.typeofuser !== "seller") {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .send({ msg: "Unauthorized access. Please login again." });
  }
});

module.exports = { getCreditMoney, addCreditMoney };
