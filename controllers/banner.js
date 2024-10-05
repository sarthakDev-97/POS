const { StatusCodes } = require("http-status-codes");
const bannerModel = require("../models/banner");
const asyncWrapper = require("../middlewares/async");
const myCache = require("../middlewares/caching");

const getAllBanners = asyncWrapper(async (req, res) => {
  const cachedBanners = myCache.get("banners");
  if (cachedBanners !== undefined) {
    return res.status(StatusCodes.OK).send({
      banners: myCache.get("banners"),
      msg: "Banners retrieved successfully.",
    });
  }
  const banners = await bannerModel.find().sort("priority").lean();
  if (!banners) {
    return res
      .status(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Banners not found. Please check again." });
  }
  myCache.set("banners", banners, 7200);
  res
    .status(StatusCodes.OK)
    .send({ banners, msg: "Banners retrieved successfully." });
});

const createBanner = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .status(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Unauthorized access. Please login again." });
  }
  const banner = await bannerModel.create(req.body);
  if (!banner) {
    return res
      .status(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Banner not created" });
  }
  myCache.del("banners");
  res
    .status(StatusCodes.CREATED)
    .send({ banner, msg: "Banner created successfully." });
});

const updateBanner = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .status(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Unauthorized access. Please login again." });
  }
  const { id } = await req.params;
  const banner = await bannerModel.findByIdAndUpdate(id, req.body, {
    new: true,
  });
  if (!banner) {
    return res
      .status(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Banner not updated. Please check again." });
  }
  myCache.del("banners");
  res
    .status(StatusCodes.OK)
    .send({ banner, msg: "Banner updated successfully." });
});

const deleteBanner = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser !== "admin") {
    return res
      .status(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Unauthorized access. Please login again." });
  }
  const { id } = await req.params;
  const banner = await bannerModel.findByIdAndDelete(id);
  if (!banner) {
    return res
      .status(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Banner not deleted. Please check again." });
  }
  myCache.del("banners");
  res.status(StatusCodes.OK).send({ msg: "Banner deleted successfully." });
});

module.exports = {
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
