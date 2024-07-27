const customErrors = require("../errors/customError");
const { StatusCodes } = require("http-status-codes");

const errHandler = async (err, req, res) => {
  if (err instanceof customErrors) {
    return res.code(err.statusCode).send({ msg: err.message });
  }
  return res
    .code(StatusCodes.INTERNAL_SERVER_ERROR)
    .send({ msg: `Internal Server Error.`, err });
};
module.exports = errHandler;
