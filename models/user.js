import { Schema, model } from "mongoose";
import Joi from "joi";
import { handleMongooseError } from "../helpers/handleMongooseError.js";

const emailRegexp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

const userSchema = new Schema(
  {
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    email: {
      type: String,
      match: emailRegexp,
      required: [true, "Email is required"],
      unique: true,
    },
    token: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      default: "User",
    },
    weight: {
      type: Number,
      default: 0,
    },
    dailyActiveTime: {
      type: Number,
      default: 0,
    },
    dailyWaterConsumption: {
      type: Number,
      default: 1.5,
    },
    gender: {
      type: String,
      enum: ["woman", "man"],
      default: "man",
    },
    photo: {
      type: String,
      default: null,
    },
    access: { type: Boolean, default: true },

    verify: {
      type: Boolean,
      default: false,
    },
    oauth: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: null,
      validate: {
        validator: function (v) {
          return this.oauth || v !== null;
        },
        message: "Verify token is required for non-OAuth users",
      },
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

userSchema.post("save", handleMongooseError);
const User = model("User", userSchema);

const userRegisterSchema = Joi.object({
  password: Joi.string().min(1).required(),
  email: Joi.string().email().trim().lowercase().required().messages({
    "any.required": "Email is required",
    "string.email": "Email must be a valid email",
    "string.empty": "Email cannot be empty",
  }),
});

const loginUserSchema = Joi.object({
  password: Joi.string().required(),
  email: Joi.string().email().trim().lowercase().required().messages({
    "any.required": "Email is required",
    "string.email": "Email must be a valid email",
    "string.empty": "Email cannot be empty",
  }),
});

export const infoUserSchema = Joi.object({
  email: Joi.string().email(),
  name: Joi.string().trim(),
  weight: Joi.number().min(0),
  dailyActiveTime: Joi.number().min(0),
  dailyWaterConsumption: Joi.number().min(0),
  gender: Joi.string().valid("woman", "man"),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be filled",
  });

const updateUserAccessSchema = Joi.object({
  access: Joi.boolean().required(),
});

export const resetPasswordSchema = Joi.object({
  password: Joi.string().required(),
  token: Joi.string().required(),
});

export const sendResetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const schemas = {
  userRegisterSchema,
  loginUserSchema,
  infoUserSchema,
  updateUserAccessSchema,
  resetPasswordSchema,
  sendResetPasswordSchema,
};

export { User, schemas };
