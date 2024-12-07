const cron = require("node-cron");
const fs = require("fs");
const path = require("path");

const bannerModel = require("../models/banner");
const productModel = require("../models/products/product");
const variationModel = require("../models/products/variation");

const deleteJob = () => {
  cron.schedule(
    "33 4 * * 6",
    async () => {
      try {
        const banners = await bannerModel.find();
        const bannerFiles = banners.map((banner) => banner.image);

        const products = await productModel.find({ image: { $ne: [] } });
        const productFiles = products.flatMap((product) => product.image);

        const variations = await variationModel.find({ image: { $ne: null } });
        const variationFiles = variations.map((variation) => variation.image);

        const allFiles = [...bannerFiles, ...productFiles, ...variationFiles];
        // console.log(allFiles);

        const publicFolder = path.join(__dirname, "../public/images");
        const files = fs.readdirSync(publicFolder);

        const unusedFiles = files.filter(
          (file) => !allFiles.includes(file) && file !== "logo.png"
        );
        console.log(unusedFiles);

        unusedFiles.forEach(async (file) => {
          const filePath = path.join(__dirname, "../public/images", file);
          fs.unlinkSync(filePath);
          console.log(`Deleted ${file}`);
        });
      } catch (error) {
        console.log(error);
      }
    },
    { timezone: "Asia/Kolkata" }
  );
};

module.exports = deleteJob;
