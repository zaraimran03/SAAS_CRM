const yup = require("yup");

const passwordRules = yup
  .string()
  .required("Password is required")
  .min(8, "Password must be at least 8 characters")
  .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
  .matches(/[a-z]/, "Password must contain at least one lowercase letter")
  .matches(/[0-9]/, "Password must contain at least one number")
  .matches(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );

const registerSchema = yup.object({
  fullName: yup.string().required("Full Name is required").trim(),

  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required")
    .trim()
    .lowercase(),

  phone: yup.string().required("Phone number is required").trim(),

  password: passwordRules,

  confirmPassword: yup
    .string()
    .required("Confirm Password is required")
    .oneOf([yup.ref("password")], "Passwords do not match"),
});

const loginSchema = yup.object({
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required")
    .trim()
    .lowercase(),

  password: yup.string().required("Password is required"),
});

const resetPasswordSchema = yup.object({
  password: passwordRules,

  confirmPassword: yup
    .string()
    .required("Confirm Password is required")
    .oneOf([yup.ref("password")], "Passwords do not match"),
});

module.exports = {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
};