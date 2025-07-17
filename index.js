require("dotenv").config();
const { swaggerUi, swaggerSpec } = require("./swagger");
require("express-async-errors");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const connection = require("./db");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const songRoutes = require("./routes/songs");
const playListRoutes = require("./routes/playLists");
const searchRoutes = require("./routes/search");
const app = express();

// Initialize Multer with the correct field name
const upload = multer({ dest: "uploads/", fieldName: "songFile" });
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
connection();
app.use(cors());
app.use(express.json());
app.use(
  bodyParser.json({
    limit: "50mb",
  })
);
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
  })
);

// Use Multer middleware before the routes that handle file uploads

app.use("/api/users/", userRoutes);
app.use("/api/login/", authRoutes);
app.use("/api/songs/", songRoutes);
app.use("/api/playlists/", playListRoutes);
app.use("/api/", searchRoutes);

const port = 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
