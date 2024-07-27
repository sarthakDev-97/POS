const { StatusCodes } = require("http-status-codes");

const notFound = (req, res) => {
  res
    .code(StatusCodes.NOT_FOUND)
    .send("Route do not exist for the requested API url.");
};

module.exports = notFound;
