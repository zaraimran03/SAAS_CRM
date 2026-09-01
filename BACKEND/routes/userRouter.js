const express = require("express");

const userRouter = express.Router();

userRouter.get("/", (req, res) => {
  res.json({
    status: 200,
    message: "Users route is working.",
  });
});

userRouter.get("/profile", (req, res) => {
  res.json({
    status: 200,
    message: "User profile data.",
    user: req.user,
  });
});

module.exports = userRouter;