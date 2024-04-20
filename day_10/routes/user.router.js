const express = require("express");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../model/user.model");
const authenticateToken = require("../middlewares/authenticationMiddleware");
const axios = require("axios");
const FormData = require("form-data");

const userRouter = express.Router();

// List users endpoint with pagination
userRouter.get("/", authenticateToken, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const users = await User.find().select("-password").skip(skip).limit(limit);
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
  const { email, password, pic } = req.body;

  try {
    if (!email || !password)
      return res.status(400).json({ msg: "Required fields not provided" });
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
      if (pic) newUser.pic = pic;
      await newUser.save();

      return res.status(201).send({ msg: "Success" });
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
    if (!email)
      return res.status(400).json({ message: "Required details not found" });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (password) {
      let hashedPassword = await bcrypt.hash(password, 4);
      user.password = hashedPassword;
      user.save();
    }

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

userRouter.get("/analytics", async (req, res) => {
  try {
    const insights = await User.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id field
          month: "$_id", // Rename _id field to month
          count: 1, // Include count field
        },
      },
      { $sort: { _id: 1 } }, // Optional: Sort by month/year
    ]);
    return res.status(200).json({ msg: "Success", data: insights });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Internal server error", error: error.message });
  }
});

userRouter.post("/upload_pic", authenticateToken, async (req, res) => {
  const pic = req.body.pic;
  if (pic.type === "image/jpeg" || pic.type === "image/png") {
    try {
      const data = new FormData();
      data.append("file", pic);
      data.append("upload_preset", process.env.upload_preset);
      data.append("cloud_name", process.env.cloud_name);

      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dlz45puq4/image/upload",
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const imageUrl = response.data.url;
      console.log("Uploaded image URL:", imageUrl);

      const userId = req.userId;
      const user = await User.findById(userId);
      user.pic = imageUrl;
      await user.save();

      return res
        .status(200)
        .json({ msg: "Image uploaded and URL updated successfully", imageUrl });
    } catch (error) {
      return res
        .status(500)
        .json({ msg: "Error uploading image", error: error.message });
    }
  } else {
    return res.status(400).json({ msg: "Unsupported file type" });
  }
});

module.exports = userRouter;
