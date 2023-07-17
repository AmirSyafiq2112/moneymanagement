const client = require("../db");
const InvalidArgumentError = require("../error");

const transactionAttribute = [
  "id",
  "transaction_name",
  "value",
  "description",
  "dt_transaction",
];

const insertTransactionAttribute = transactionAttribute.slice(0, -1).join(", ");
const selectTransactionAttribute = transactionAttribute.join(", ");

async function getTransactions({ sortBy, offset, limit, desc }) {
  validate(
    sortBy !== undefined && transactionAttribute.includes(sortBy) === false,
    "sortBy must be a transaction attribute"
  );
  validate(
    offset !== undefined && isNaN(+offset) === true,
    "offset must be a number if defined"
  );
  validate(
    limit !== undefined && isNaN(+limit) === true,
    "limit must be a number if defined"
  );
  validate(
    desc !== undefined && typeof desc !== "boolean",
    "desc must be a boolean if defined"
  );

  let query = `
    select ${selectTransactionAttribute}
    from transactions
    `;

  let bindVariables = [];

  if (sortBy !== undefined) {
    query = query + ` order by ${sortBy}`;
  } else {
    query = query + ` order by dt_transaction`;
  }

  if (desc !== false) query = query + ` desc`;

  if (limit !== undefined) {
    query = query + ` limit $${bindVariables.length + 1}`;
    bindVariables.push(+limit);
  }

  if (offset !== undefined) {
    query = query + ` offset $${bindVariables.length + 1}`;
    bindVariables.push(+offset);
  }

  let results;
  try {
    results = await client.query(query, bindVariables);
  } catch (error) {
    console.log(error);
    return undefined;
  }

  return results.rows;
}

async function getTransaction({ transactionId }) {
  if (typeof transactionId !== "string") return undefined;

  const query = `
        select ${selectTransactionAttribute}
        from transactions
        where id = $1
    `;

  let results;
  try {
    results = await client.query(query, [transactionId]);
    // console.log(typeof transactionId);
  } catch (error) {
    console.error(error);
    return undefined;
  }

  if (results.rowCount === 0) return null;

  return results.rows[0];

  // return "testingTransaction2";
}

function validate(expression, errorMessage) {
  if (expression) throw new InvalidArgumentError(errorMessage);
}

function makeValidation(attribute, value) {
  switch (attribute) {
    case "transaction_name":
      validate(
        typeof value !== "string" || value.length === 0,
        "transaction_name must be a string and longer than 0"
      );
      break;
    case "value":
      validate(
        typeof value !== "number" || value < 0,
        "Value must be a number and a positive value"
      );
      break;
    case "description":
      validate(
        typeof value !== "string" && value !== undefined,
        "Description must be a string if existed"
      );
      break;
    default:
      console.error("Unknown attribute value : " + attribute);
  }
}

async function addTransaction({ id, transaction_name, value, description }) {
  if (typeof id !== "string" || id.length === 0)
    throw new Error("Id must be a string and longer than 0");
  makeValidation("transaction_name", transaction_name);
  makeValidation("value", value);
  makeValidation("description", description);

  let response;
  try {
    response = await client.query(
      `
        insert into transactions (${insertTransactionAttribute})
        values ($1, $2, $3, $4)
    `,
      [id, transaction_name, value, description]
    );
  } catch (error) {
    // console.error(error);
    return undefined;
  }

  return response;
}

async function updateTransaction({ id, newAttributes }) {
  //newAttributes is an object { attribute : 'valueAttribute'}

  // if (typeof id !== "string" || id.length === 0)
  //   throw new Error("Id must be a string and longer than 0");
  // validate(
  //   typeof newAttributes !== "object",
  //   "New attributes must be provided as an object"
  // );

  // const validAttribute = Object.keys(newAttributes).filter((element) =>
  //   transactionAttribute.includes(element)
  // );
  // validate(
  //   validAttribute.length === 0,
  //   "At least one valid attribute to update must be provided"
  // );

  // let query = `update transactions set `;
  // let bindVariables = [id];
  // validAttribute.forEach((attribute, column, keys) => {
  //   makeValidation(attribute, newAttributes[attribute]);
  //   query = query + ` ${attribute} = $${column + 2}`;
  //   bindVariables.push(newAttributes[attribute]);

  //   if (column < keys.length - 1) query = query + ", ";
  // });

  // query = query + ` where id = $1 `;

  // let response;
  // try {
  //   response = await client.query(query, bindVariables);
  // } catch (error) {
  //   console.error(e);
  //   return undefined;
  // }

  // return response;

  if (typeof id !== "string" || id.length === 0)
    throw new Error("Id must be a string and longer than 0");
  validate(
    typeof newAttributes !== "object",
    "New attibutes must be provided as an object"
  );

  const validAttributes = Object.keys(newAttributes).filter((element) =>
    transactionAttribute.includes(element)
  );
  validate(
    validAttributes.length === 0,
    "At least one valid attribute to update must be provided"
  );

  let query = `update transactions set `;
  let bindVariables = [id];
  validAttributes.forEach((attribute, i, keys) => {
    makeValidation(attribute, newAttributes[attribute]);
    query = query + ` ${attribute} = $${i + 2}`;
    bindVariables.push(newAttributes[attribute]);
    if (i < keys.length - 1) query = query + ", ";
  });

  query = query + ` where id = $1 `;
  let resp;
  try {
    resp = await client.query(query, bindVariables);
  } catch (e) {
    console.error(e);
    return undefined;
  }

  return resp;
}

async function deleteTransaction({ transactionId }) {
  if (typeof transactionId !== "string") return undefined;

  let response;
  try {
    response = await client.query(
      `
        delete from transactions
        where id = $1
    `,
      [transactionId]
    );
  } catch (error) {
    console.error(error);
    return undefined;
  }

  return response;
}

module.exports = {
  getTransactions,
  getTransaction,
  addTransaction,
  updateTransaction,
  deleteTransaction,
};
