const { StatusCodes } = require("http-status-codes");

const asyncWrapper = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next); // Call the asynchronous function
    } catch (error) {
      // console.log(error); // Uncomment to log the error for debugging
      if (typeof next === "function") {
        // Ensure next is a function before calling it
        next(error); // Pass the error to the next middleware or error handler
      } else {
        // If next is not a function, log the error
        if (error.name === "ValidationError") {
          const validationErrors = await Object.values(error.errors).map(
            (err) => ({ msg: err.message })
          );
          return res.code(StatusCodes.PARTIAL_CONTENT).send({
            errors: validationErrors,
            msg: `Validation Error. ${validationErrors[0].msg}`,
          });
        }
        if (error.keyValue?.phone) {
          return res
            .code(StatusCodes.PARTIAL_CONTENT)
            .send({ msg: "Account with this phone number already exists." });
        }
        if (error.name === "MongoServerError") {
          return res
            .code(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
            .send({ msg: `${error.errorResponse?.errmsg}` });
        }
        res
          .code(StatusCodes.INTERNAL_SERVER_ERROR)
          .send({ msg: "Internal Server Error" });
      }
    }
  };
};

module.exports = asyncWrapper;
