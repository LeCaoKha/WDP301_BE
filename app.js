var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
require("dotenv").config();

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

const accountRouter = require("./routes/accountRouter");
const authRouter = require("./routes/authRouter");
const vehicleRouter = require("./routes/vehicleRouter");
const companyRouter = require("./routes/companyRouter");
const subscriptionRouter = require("./routes/subscriptionRouter");
const vehicleSubscriptionRouter = require("./routes/vehicleSubscriptionRouter");
const bookingRouter = require("./routes/bookingRouter");
const stationRouter = require("./routes/stationRouter");
const chargingRouter = require("./routes/chargingRouter");
const paymentRouter = require("./routes/paymentRouter");
const chargingSessionRouter = require("./routes/chargingSessionRouter");
const staffRouter = require("./routes/staffRouter");
var app = express();

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Database connection is initialized in `bin/www` via `config/database.js`

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
app.use("/api/companies", companyRouter);
app.use("/api/subscription-plans", subscriptionRouter);
app.use("/api/vehicle-subscriptions", vehicleSubscriptionRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/stations", stationRouter);
app.use("/api/charging-point", chargingRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/charging-sessions", chargingSessionRouter);
app.use("/api/staff", staffRouter);
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
