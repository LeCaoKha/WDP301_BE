var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const mongoose = require("mongoose");

const accountRouter = require("./routes/accountRouter");
const authRouter = require("./routes/authRouter");
const vehicleRouter = require("./routes/vehicleRouter");
const stationRouter = require("./routes/stationRouter")
const chargingRouter = require("./routes/chargingRouter")
var app = express();
// mongodb connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/auth", authRouter);
app.use("/api/vehicles", vehicleRouter);
app.use("/api/stations", stationRouter);
app.use("/api/charging-point", chargingRouter);
const swaggerDocs = require("./swagger");
swaggerDocs(app, process.env.PORT || 5000);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
