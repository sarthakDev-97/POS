const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");
const { StatusCodes } = require("http-status-codes");
const asyncWrapper = require("../../../middlewares/async");
const { toBoolean, toFloat } = require("validator");

let data = [];

const csvFile = asyncWrapper(async (req, res) => {
  const file = await new Promise(async (resolve, reject) => {
    fs.createReadStream(
      path.join(__dirname, "../../../public/csv", req.files[0].filename) // Reading the CSV file
    )
      .pipe(parse({ delimiter: ",", from_line: 2 })) // Parsing the CSV file
      .on("data", async (row) => {
        const name = row[0].split(",")[0];
        const description =
          row[1].split(",")[0] !== "" ? row[1].split(",")[0] : null;
        const slug = row[2].split(",")[0] !== "" ? row[2].split(",")[0] : [];
        const color = row[3].split(",")[0] !== "" ? row[3].split(",")[0] : null;
        const businessLocation =
          row[4].split(",")[0] !== "" ? row[4].split(",")[0] : null;
        const unitPurchasePriceLow =
          row[5].split(",")[0].split("-")[0] !== ""
            ? row[5].split(",")[0].split("-")[0]?.split(" ")[1]
            : 0;
        const unitPurchasePriceHigh =
          row[5].split(",")[0].split("-")[1] !== ""
            ? row[5].split(",")[0]?.split("-")[1]?.trim().split(" ")[1]
            : 0;
        const unitSellingPriceLow =
          row[6].split(",")[0].split("-")[0] !== ""
            ? row[6].split(",")[0].split("-")[0]?.split(" ")[1]
            : 0;
        const unitSellingPriceHigh =
          row[6].split(",")[0].split("-")[1] !== ""
            ? row[6].split(",")[0]?.split("-")[1]?.trim().split(" ")[1]
            : 0;
        const unit1 = row[7].split(",")[0].split(" ")[1]
          ? row[7].split(",")[0]
          : null;
        const currentStock =
          row[7].split(",")[0] !== ""
            ? toFloat(row[7].split(",")[0].split(" ")[0])
            : 0;
        const minStock =
          row[8].split(",")[0] !== ""
            ? toFloat(row[8].split(",")[0].split(" ")[0])
            : 0;
        const productType =
          row[9].split(",")[0] !== "" ? row[9].split(",")[0] : "single";
        const category =
          row[10].split(",")[0] !== ""
            ? row[10].split(",")[0].split("-")[0]
            : null;
        const subCategory = row[10].split(",")[0].split("-")[1]
          ? row[10].split(",")[0].split("-")[1]
          : null;
        const brand =
          row[11].split(",")[0] !== "" ? row[11].split(",")[0] : null;
        const tax = row[12].split(",")[0] !== "" ? row[12].split(",")[0] : null;
        const sku = row[13].split(",")[0] !== "" ? row[13].split(",")[0] : null;
        const isActive =
          row[14].split(",")[0] !== ""
            ? toBoolean(row[14].split(",")[0])
            : true;

        const obj = {
          name,
          description,
          slug,
          color,
          businessLocation,
          unitSellingPriceLow,
          unitSellingPriceHigh,
          unitPurchasePriceLow,
          unitPurchasePriceHigh,
          currentStock,
          unit: unit1,
          minStock,
          productType,
          category,
          subCategory,
          brand,
          tax,
          sku,
          isActive,
        };
        data.push(obj);
      })
      .on("end", async () => {
        data.forEach(async (obj) => {
          // Creating an object with extracted data
          obj.unitPurchasePriceLow =
            parseFloat(obj.unitPurchasePriceLow || 0).toFixed(2) || 0.0;
          obj.unitPurchasePriceHigh =
            parseFloat(obj.unitPurchasePriceHigh || 0).toFixed(2) || 0.0;
          obj.unitSellingPriceLow =
            parseFloat(obj.unitSellingPriceLow || 0).toFixed(2) || 0.0;
          obj.unitSellingPriceHigh =
            parseFloat(obj.unitSellingPriceHigh || 0).toFixed(2) || 0.0;
        });
        resolve(data);
        req.data = data;
        try {
          fs.unlink(
            path.join(__dirname, "../../../public/csv", req.files[0].filename), // Deleting the CSV file
            (err) => {
              if (err) {
                console.error(err);
                return;
              }
            }
          );
        } catch (err) {
          console.error(err);
          return;
        }
      })
      .on("error", (error) => {
        console.log(error);
        reject(error); // Rejecting the promise with the error
      });
  });
  if (!file) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "File conversion Error." }); // Sending an error response if file conversion fails
  }
});

module.exports = csvFile;
