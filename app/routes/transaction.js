const { v4: uuidv4 } = require("uuid");

const InvalidArgumentError = require("../error");
const {
  getTransactions,
  getTransaction,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} = require("../models/transaction");

const router = require("express").Router();

router.get("/", async (req, res) => {
  const { limit, offset, sortBy } = req.query;
  const desc = req.query.desc !== undefined ? true : false;

  let transactions;
  try {
    transactions = await getTransactions({ sortBy, offset, limit, desc });
  } catch (error) {
    if (error instanceof InvalidArgumentError)
      return res.status(400).json({ message: error.message });

    return res.sendStatus(500); //error on server side (this side )
  }

  if (transactions === undefined) return res.sendStatus(500);

  return res.json(transactions);
});

router.get("/:transactionId", async (req, res) => {
  const { transactionId } = req.params;

  let transaction;
  try {
    transaction = await getTransaction({ transactionId });
  } catch (error) {
    if (transaction === undefined) return res.sendStatus(500);
    if (transaction === null) return res.sendStatus(404);

    res.json(transaction);
  }
});

router.post("/", async (req, res) => {
  const { transaction_name, value, description } = req.body;

  let response;
  let id = uuidv4();
  try {
    response = await addTransaction({
      id,
      transaction_name,
      value,
      description,
    });
  } catch (error) {
    console.log(error);
    if (error instanceof InvalidArgumentError)
      return res.sendStatus(400).json({ message: error.message });
    return res.sendStatus(500);
  }

  if (response === undefined) return res.sendStatus(500);

  res.status(201).json({ id, message: "Transaction has been added" });
});

router.patch("/", async (req, res) => {
  const {
    id,
    newAttribute: {},
  } = req.body;

  let response;
  try {
    response = await updateTransaction({ id, newAttributes });
  } catch (error) {
    if (error instanceof InvalidArgumentError)
      return res.statussend(400).json({ message: error.message });
    res.sendStatus(500);
  }

  if (response === undefined) return res.sendStatus(500);

  res.status(201).json({ id, message: "Transaction has been updated" });
});

router.delete("/", async (req, res) => {
  const { id } = req.body;

  let response;
  try {
    response = await deleteTransaction({ transactionId });
  } catch (error) {
    if (error instanceof InvalidArgumentError)
      return res.sendStatus(400).json({ message: error.message });
    res.sendStatus(500);
  }

  if (response.rowCount === 0) return res.sendStatus(400);
  if (response === undefined) return res.sendStatus(500);

  res.status(201).json({ message: "Transaction has been deleted" });
});

module.exports = router;
