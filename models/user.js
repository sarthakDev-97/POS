const mongoose = require("mongoose");
const { isEmail, isMobilePhone } = require("validator");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      trim: true,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function (value) {
          if (value !== null) {
            return isEmail(value);
          }
          return true;
        },
        message: "Email Id is not valid.",
      },
    },
    gstNumber: {
      type: String,
      trim: true,
      default: null,
    },
    panNumber: {
      type: String,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      validate: {
        validator: function (value) {
          if (value !== null) {
            return isMobilePhone(value, "en-IN");
          }
          return true;
        },
        message: "Phone Number should be valid Indian Phone Number.",
      },
    },
    typeofuser: {
      type: String,
      trim: true,
      enum: ["user", "admin", "seller"],
      default: "user",
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
