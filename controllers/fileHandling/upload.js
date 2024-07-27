const { StatusCodes } = require("http-status-codes"); // Importing the StatusCodes object from the http-status-codes module
const asyncWrapper = require("../../middlewares/async"); // Importing the asyncWrapper middleware
const fs = require("fs"); // Importing the fs module for file system operations
const { parse } = require("csv-parse"); // Importing the parse function from the csv-parse module
const path = require("path"); // Importing the path module for working with file paths
const test = require("../../models/test"); // Importing the test model

const uploadFile = async (req, res) => {
  const fileResponses = await req.files.map((file) => file.filename); // Mapping the filenames of uploaded files
  res
    .code(StatusCodes.OK)
    .send({ files: fileResponses, msg: "Files uploaded successfully." }); // Sending the response with uploaded file information
};

const getFile = async (req, res) => {
  const files = "hello"; // Placeholder value for files
  res.code(StatusCodes.OK).send({ files }); // Sending the response with files
};

const csvFile = asyncWrapper(async (req, res) => {
  const file = await new Promise((resolve, reject) => {
    const data = [];
    fs.createReadStream(
      path.join(__dirname, "../../public/csv", req.files[0].filename) // Reading the CSV file
    )
      .pipe(parse({ delimiter: ",", from_line: 2 })) // Parsing the CSV file
      .on("data", (row) => {
        const name = row[0].split(",")[0]; // Extracting name from the row
        const age = row[1].split(",")[0]; // Extracting age from the row
        const email = row[2].split(",")[0]; // Extracting email from the row
        const obj = { name, age, email }; // Creating an object with extracted data
        data.push(obj); // Adding the object to the data array
      })
      .on("end", () => {
        resolve(data); // Resolving the promise with the data array
      })
      .on("error", (error) => {
        reject(error); // Rejecting the promise with the error
      });
  });
  if (!file) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "File conversion Error." }); // Sending an error response if file conversion fails
  }
  const data = await test.insertMany(file); // Inserting the data into the test model
  if (data) {
    try {
      fs.unlink(
        path.join(__dirname, "../../public/csv", req.files[0].filename), // Deleting the CSV file
        (err) => {
          if (err) {
            console.error(err);
            return;
          }
        }
      );
      return res.code(StatusCodes.OK).send({ data }); // Sending the response with the inserted data
    } catch (err) {
      console.error(err);
      return res
        .code(StatusCodes.PARTIAL_CONTENT)
        .send({ msg: "Something went wrong" }); // Sending an error response if something goes wrong
    }
  }
  res.code(StatusCodes.PARTIAL_CONTENT).send({ msg: "Something went wrong" }); // Sending an error response if something goes wrong
});

module.exports = {
  uploadFile,
  getFile,
  csvFile,
};
