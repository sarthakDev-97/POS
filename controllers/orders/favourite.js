const asyncWrapper = require("../../middlewares/async");
const { StatusCodes } = require("http-status-codes");
const favModel = require("../../models/orders/favourite");

const getAllFavourites = asyncWrapper(async (req, res) => {
  const favourites = await favModel
    .find({ user: req.user.userId })
    .select("-__v -user -updatedAt")
    .populate({ path: "product", select: "name image variation isActive" })
    .lean();
  if (!favourites) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "No favourites found for this user." });
  }
  res
    .code(StatusCodes.OK)
    .send({ favourites, msg: "Favourites retrieved successfully." });
});

const addFavourite = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const favourite = await favModel.create({
    user: req.user.userId,
    product: id,
  });
  if (!favourite) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Favourite could not be added." });
  }
  res
    .code(StatusCodes.OK)
    .send({ favourite, msg: "Favourite added successfully." });
});

const removeFavourite = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const favourite = await favModel.findOneAndDelete({
    user: req.user.userId,
    product: id,
  });
  if (!favourite) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Favourite could not be removed." });
  }
  res.code(StatusCodes.OK).send({ msg: "Favourite removed successfully." });
});

module.exports = {
  getAllFavourites,
  addFavourite,
  removeFavourite,
};
