const fs = require("fs");

const client = require("../app/db");

before(async () => {
  const transaction = fs.readFileSync("../ddl/transaction.sql").toString();
  const transactionTestData = fs
    .readFileSync("../ddl/transactionTestData.sql")
    .toString();
  const apiKey = fs.readFileSync("../ddl/api_key.sql").toString();
  const apiKeyTestData = fs
    .readFileSync("../ddl/api_keyTestData.sql")
    .toString();

  const stringSQL = transaction + transactionTestData + apiKey + apiKeyTestData;
  const arraySQL = stringSQL.split(";");
  arraySQL.forEach(async (sql) => {
    await client.query(sql);
  });
});
