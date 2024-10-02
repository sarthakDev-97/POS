const { StatusCodes } = require("http-status-codes");
const asyncWrapper = require("../../middlewares/async");
const reviewSchema = require("../../models/products/review");

const getAllReviews = asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const results = parseInt(req.query.results) || 5;
  const skip = (page - 1) * results;
  const reviews = await reviewSchema
    .find({ product: req.params.id })
    .select("rating review createdAt updatedAt user")
    .populate({
      path: "user",
      select: "name username",
    })
    .sort("-createdAt")
    .skip(skip)
    .limit(results)
    .lean();
  if (!reviews) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "No reviews found. Please check again." });
  }
  const totalData = await reviewSchema.countDocuments({
    product: req.params.id,
  });
  const totalPages = Math.ceil(totalData / results);
  return res.code(StatusCodes.OK).send({
    reviews,
    msg: "Reviews retrieved successfully.",
    itemsPerPage: results,
    pageNo: page,
    total: totalData,
    totalPages: totalPages,
  });
});

const createReview = asyncWrapper(async (req, res) => {
  const review = await reviewSchema.create({
    user: req.user.userId,
    product: req.params.id,
    rating: req.body.rating,
    review: req.body.review,
  });
  if (!review) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Review not created. Please check again." });
  }
  res
    .code(StatusCodes.CREATED)
    .send({ review, msg: "Review created successfully." });
});

const updateReview = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const review = await reviewSchema
    .findOneAndUpdate(
      {
        _id: id,
        user: req.user.userId,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
    .lean();
  if (!review) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Review not found. Please check again." });
  }
  return res
    .code(StatusCodes.OK)
    .send({ review, msg: "Review updated successfully." });
});

const deleteReview = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const review = await reviewSchema
    .findOneAndDelete({
      _id: id,
      user: req.user.userId,
    })
    .lean();
  if (!review) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Review not deleted. Please check again." });
  }
  res.code(StatusCodes.OK).send({ msg: "Review deleted successfully." });
});

module.exports = { getAllReviews, createReview, updateReview, deleteReview };
