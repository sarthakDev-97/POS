const path = require("path");
const asyncWrapper = require("../middlewares/async");
const fs = require("fs");
const { parse } = require("csv-parse");

const test = async () => {
  const data = [];
  fs.createReadStream(path.join(__dirname, "../public/csv", "test.csv"))
    .pipe(
      parse({
        delimiter: ",",
        from_line: 2,
      })
    )
    .on("data", (row) => {
      console.log(row[0]);
      const name = row[0].split(",")[0];
      const age = row[1].split(",")[0];
      const email = row[2].split(",")[0];
      const obj = { name, age, email };
      data.push(obj);
    })
    .on("end", () => {
      //   console.log(data);
    })
    .on("error", (error) => {
      console.error(error);
    });
};

module.exports = { test }; // Exporting the test function
