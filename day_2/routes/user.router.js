const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../model/user.model");

const userRouter = express.Router();

// List users endpoint with pagination
userRouter.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const users = await User.find().skip(skip).limit(limit);
    return res.status(200).json({ msg: "Success", data: users });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Internal server error", error: error.message });
  }
});

userRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password)
      return res.status(400).json({ message: "Required details not provided" });
    const findUser = await User.find({ email });
    if (!findUser) return res.status(404).send({ msg: "User not found" });

    bcrypt.compare(password, findUser[0].password, (err, result) => {
      if (result) {
        const token = jwt.sign(
          { userID: findUser[0]._id },
          process.env.secret_key
        );
        return res
          .status(200)
          .json({ msg: "Login Successful", token, findUser });
      } else
        return res.status(401).json({ message: "Invalid email or password" });
    });
  } catch (error) {
    return res
      .status(500)
      .send({ msg: "Internal server error", error: error.message });
  }
});

userRouter.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    const existCheck = await User.find({ email });
    if (existCheck.length > 0) {
      return res.status(400).send({ msg: "User exist with this email id" });
    }
    bcrypt.hash(password, 4, async function (err, hash) {
      if (err) {
        return res
          .status(500)
          .send({ msg: "Internal server error", error: err.message });
      }
      const newUser = new User({ email, password: hash });
      await newUser.save();

      return res
        .status(201)
        .send({ msg: "Registration Successful", data: newUser });
    });
  } catch (error) {
    return res
      .status(500)
      .send({ msg: "Internal server error", error: error.message });
  }
});

userRouter.patch("/update", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email && !password)
      return res.status(400).json({ message: "Required details not found" });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (email) user.email = email;
    if (password) {
      let hashedPassword = await bcrypt.hash(password, 4);
      user.password = hashedPassword;
    }

    user.save();

    return res
      .status(200)
      .json({ msg: "User updated successfully", data: user });
  } catch (error) {
    return res
      .status(500)
      .send({ msg: "Internal server error", error: error.message });
  }
});

userRouter.delete("/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    await User.deleteOne({ _id: userId });

    return res.status(204).json({ msg: "Success" });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Internal server error", error: error.message });
  }
});

module.exports = userRouter;
