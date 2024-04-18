const express = require("express");
require("dotenv").config();
const cors = require("cors");
const userRouter = require("./routes/user.router");
const connection = require("./config/dbConfig");
const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) =>
  res.status(200).json({ message: "Hello from server!" })
);
app.use("/api/user", userRouter);

app.listen(process.env.PORT, async () => {
  try {
    await connection;
    console.log(`Server at ${process.env.PORT} \nDB connected successfully.`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
});
