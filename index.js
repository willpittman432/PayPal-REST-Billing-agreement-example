const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const ejs = require("ejs");

const PORT = 5000;

//MIDDLEWARE
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

//VIEW ENGINE
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

app.get("/", (req, res) => {
  res.render("index");
});

//routes

const paypalBA = require("./routes/paypalBA");
app.use("/paypalBA", paypalBA);
const paypalBAOrders = require("./routes/paypalBAOrders");
app.use("/paypalBAOrders", paypalBAOrders);
const paypalOrder = require("./routes/paypalOrder");
app.use("/paypalOrder", paypalOrder);
const paypalOrderComplete = require("./routes/paypalOrderComplete");
app.use("/paypalOrderComplete", paypalOrderComplete);

app.listen(process.env.PORT || PORT, () => {
  console.log(`server listening on port ${PORT}`);
});
