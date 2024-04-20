const express = require("express");
require("dotenv").config();
const cors = require("cors");
const userRouter = require("./routes/user.router");
const connection = require("./config/dbConfig");
const logMiddleware = require("./middlewares/logMiddleware");
const cacheMiddleware = require("./middlewares/cacheMiddleware");
const rateLimitMiddleware = require("./middlewares/rateLimitMiddleware");
const app = express();

const YAML = require("yamljs");
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = YAML.load("./api.yaml");
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerJsDoc));

app.use(express.json());
app.use(cors());

const maxRequests = 20;
const windowMs = 60 * 1000;
app.use(rateLimitMiddleware(maxRequests, windowMs));
app.use(logMiddleware);

app.get("/", (req, res) =>
  res.status(200).json({ message: "Hello from server!" })
);
app.use("/api/user", cacheMiddleware, userRouter);

app.listen(process.env.PORT, async () => {
  try {
    await connection;
    console.log(`Server at ${process.env.PORT} \nDB connected successfully.`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
});
