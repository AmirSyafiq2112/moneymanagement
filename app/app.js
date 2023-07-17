const express = require("express");
const checkApiKey = require("./auth");

const transactionRouter = require("./routes/transaction");

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(checkApiKey);

app.use("/transaction", transactionRouter);

app.listen(3000);

module.exports = app;
