const chai = require("chai");
const { expect } = require("chai");
const chaiHttp = require("chai-http");
const { get } = require("mocha-suppress-logs/lib/log-capture");

const app = require("../../app/app");
const client = require("../../app/db");
const { getTransaction } = require("../../app/models/transaction");

chai.use(chaiHttp);

const util = require("util");

describe("Testing API Endpoints", () => {
  const testingTransaction1 = {
    transaction_name: "testTransactionName1",
    value: 20.5,
    description: "test description",
  };
  const testingTransaction2 = {
    transaction_name: "testTransactionName2",
    value: 40,
    description: "test description",
  };
  const testingTransaction3 = {
    transaction_name: "testTransactionName3",
    value: 0,
  };
  const testingTransaction4 = {
    transaction_name: "testTransactionName4",
    value: 0,
  };

  async function cleanup() {
    await client.query(
      `
            delete from transactions
            where transaction_name in ($1, $2, $3, $4)
        `,
      [
        testingTransaction1.transaction_name,
        testingTransaction2.transaction_name,
        testingTransaction3.transaction_name,
        testingTransaction4.transaction_name,
      ]
    );
  }

  after(async () => {
    await cleanup();
  });

  function addTransaction({ testingTransaction, endCallback }) {
    chai
      .request(app)
      .post("/transaction")
      .send(testingTransaction)
      .set("authorization", `Basic ${process.env.TESTING_API_KEY}`)
      .end(endCallback);
  }

  describe("Testing POST transaction", () => {
    before(async () => {
      await cleanup();
    });

    describe("Testing adding correct transaction", () => {
      it("correct response status", (done) => {
        addTransaction({
          testingTransaction: testingTransaction1,
          endCallback: (_err, res) => {
            expect(res).to.have.status(201);
            expect(res.body).to.have.property("id");
            testingTransaction1.id = res.body.id;
            done();
          },
        });
      });

      it("Created transaction is equal to testing transaction", async () => {
        const response = await getTransaction({
          transactionId: testingTransaction1.id,
        });
        delete response.dt_transaction;

        expect(testingTransaction1).to.deep.equal(response);
      });
    });

    describe("Testing adding transaction without value", () => {
      let countBefore;
      before(async () => {
        const resp = await client.query(`
          select count(*) as count
          from transactions
        `);

        countBefore = resp.rows[0].count;
      });

      delete testingTransaction2.value;

      it("Correct response status", (done) => {
        addTransaction({
          testingTransaction: testingTransaction2,
          endCallback: (_err, res) => {
            expect(res).to.have.status(400);
            done();
          },
        });
      });

      it("Count after is equal to count before = no new transaction created", async () => {
        const resp = await client.query(`
          select count(*) as count
          from transactions
        `);

        expect(resp.rows[0].count).to.equal(countBefore);
      });
    });
  });

  describe("Testing GET transaction", () => {
    describe("Testing getting transaction that exists", () => {
      it("Fetched book is equal to testing book", (done) => {
        chai
          .request(app)
          .get(`/transaction/${testingTransaction1.id}`)
          .set("Authorization", `Basic ${process.env.TESTING_API_KEY}`)
          .end((_err, res) => {
            delete res.body.dt_transaction;
            expect(res.body).to.deep.equal(testingTransaction1);
            done();
          });
      });
    });

    describe("Testing getting transaction that does not exist", () => {
      it("Correct response code", (done) => {
        chai
          .request(app)
          .get("/transaction/doesnotexist")
          .set("Authorization", `Basic ${process.env.TESTING_API_KEY}`)
          .end((_err, res) => {
            expect(res).to.have.status(404);
            done();
          });
      });
    });
  });

  describe("Testing GET multiple transactions", () => {
    before(async () => {
      await Promise.all([
        addTransaction({ testingTransaction: testingTransaction3 }),
        addTransaction({ testingTransaction: testingTransaction4 }),
      ]);
    });

    describe("Test limit", () => {
      it("Correct number of transactions is fetched", (done) => {
        chai
          .request(app)
          .get("/transaction?limit=2")
          .set("authorization", `Basic ${process.env.TESTING_API_KEY}`)
          .end((_err, res) => {
            expect(res.body.length).to.equal(2);
            done();
          });
      });
    });

    describe("Test SortBy", () => {
      before(async () => {
        const response = await client.query(`
          select value
          from transactions
          order by value
        `);
        value = response.rows[0].value;
      });

      it("Value equal to the selected value", (done) => {
        chai
          .request(app)
          .get("/transaction?sortBy=value&limit=1")
          .set("authorization", `Basic ${process.env.TESTING_API_KEY}`)
          .end((_err, res) => {
            expect(res.body.length).to.equal(1);
            expect(res.body[0].value).to.equal(value);
            done();
          });
      });
    });

    describe("Test offset", () => {
      let values;
      before(async () => {
        const resp = await client.query(`
          select value
          from transactions
          order by value
          limit 1 offset 1
        `);
        values = resp.rows[0].value;
      });

      it("Selected value is equal to second lowest value", (done) => {
        chai
          .request(app)
          .get(`/transaction?sortBy=value&offset=1&limit=1`)
          .set("authorization", `Basic ${process.env.TESTING_API_KEY}`)
          .end((_err, res) => {
            expect(res.body[0].value).equal(values);
            done();
          });
      });
    });
  });

  describe("testing PATCH transaction", () => {
    describe("Updating an existing transaction", () => {
      it("Correct response code", (done) => {
        chai
          .request(app)
          .patch(`/transaction/${testingTransaction1.id}`)
          .send({
            value: 45,
            description: "this is updated description",
          })
          .set("authorization", `Basic ${process.env.TESTING_API_KEY}`)
          .end((_err, res) => {
            expect(res).to.have.status(201);
            testingTransaction1.value = 45;
            testingTransaction1.description = "this is updated description";
            done();
          });
      });

      it("Transaction is equal to updated transaction", async () => {
        const transaction = await getTransaction({
          transactionId: testingTransaction1.id,
        });
        delete transaction.dt_transaction;

        expect(transaction).to.deep.equal(testingTransaction1);
      });
    });

    describe("Testing updating a transaction that does not exist", () => {
      it("Correct response code", (done) => {
        chai
          .request(app)
          .patch(`/transaction/doesnotexist`)
          .send({
            value: 45,
            description: "this is updated description",
          })
          .set("authorization", `Basic ${process.env.TESTING_API_KEY}`)
          .end((_err, res) => {
            expect(res).to.have.status(404);
            testingTransaction1.value = 45;
            testingTransaction1.description = "this is updated description";
            done();
          });
      });
    });

    describe("Testing updating id", () => {
      it("Correct response code", (done) => {
        chai
          .request(app)
          .patch(`/transaction/${testingTransaction1.id}`)
          .send({
            id: "changeId",
            value: 45,
          })
          .set("authorization", `Basic ${process.env.TESTING_API_KEY}`)
          .end((_err, res) => {
            expect(res).to.have.status(201);
            done();
          });
      });

      it("Id remains unchanged", async () => {
        const transaction = await getTransaction({
          transactionId: testingTransaction1.id,
        });

        expect(transaction).to.not.equal(null);
      });
    });
  });

  describe("Testing DELETE transaction", () => {
    describe("Deleting an existing transaction", () => {
      it("Correct response code", (done) => {
        chai
          .request(app)
          .delete(`/transaction/${testingTransaction1.id}`)
          .set("authorization", `Basic ${process.env.TESTING_API_KEY}`)
          .end((_err, res) => {
            expect(res).to.have.status(201);
            done();
          });
      });

      it("Transaction does not exist", async () => {
        const transaction = await getTransaction({
          transactionId: testingTransaction1.id,
        });
        expect(transaction).to.equal(null);
      });
    });

    describe("Deleting a transaction that does not exist", () => {
      let countBefore;

      before(async () => {
        const resp = await client.query(` 
          select count(*) as count
          from transactions
        `);

        countBefore = resp.rows[0].count;
      });

      it("Correct response code", (done) => {
        chai
          .request(app)
          .delete(`/transaction/doesnotexist`)
          .set("authorization", `Basic ${process.env.TESTING_API_KEY}`)
          .end((_err, res) => {
            expect(res).to.have.status(404);
            done();
          });
      });

      it("Count in the transaction table remains unchanged", async () => {
        const resp = await client.query(` 
          select count(*) as count
          from transactions
        `);

        expect(resp.rows[0].count).to.equal(countBefore);
      });
    });
  });

  describe("Testing API Key", () => {
    describe("Testing request without a key", () => {
      it("Correct response code", (done) => {
        chai
          .request(app)
          .get("/transaction")
          .end((_err, res) => {
            expect(res).to.have.status(400);
            done();
          });
      });
    });

    describe("Testing request with invalid key", () => {
      it("Correct response code", (done) => {
        chai
          .request(app)
          .get("/transaction")
          .set("Authorization", `Basic DoesNotExist1234`)
          .end((_err, res) => {
            expect(res).to.have.status(401);
            done();
          });
      });
    });
  });
});
