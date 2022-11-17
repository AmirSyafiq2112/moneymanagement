const { expect } = require("chai");
const client = require("../../app/db");
const InvalidArgumentError = require("../../app/error");
const util = require("util");

const {
  getTransaction,
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} = require("../../app/models/transaction");

describe("Testing models transaction", () => {
  async function cleanup(id) {
    await client.query(
      `
            delete from transactions
            where id = $1
        `,
      [id]
    );
  }

  describe("///// PRIMARY: Testing addTransaction /////", () => {
    describe("Adding correct transaction", () => {
      const testingTransaction = {
        id: "testingTransaction1",
        transaction_name: "testTransactionName",
        value: 20.5,
        description: "test description",
      };

      before(async () => {
        await cleanup(testingTransaction.id);
      });

      after(async () => {
        await cleanup(testingTransaction.id);
      });

      it("Selected transaction is equal to testing transaction", async () => {
        await addTransaction(testingTransaction);
        const response = await client.query(
          `
            select id, transaction_name, value, description
            from transactions
            where id = $1
        `,
          [testingTransaction.id]
        );

        expect(response.rows.length).to.equal(1);
        const transaction = response.rows[0];
        expect(transaction).to.deep.equal(testingTransaction);
      });
    });

    describe("Adding book with no Id", () => {
      const testingTransaction = {
        // id: "testingTransaction1",
        transaction_name: "testTransactionName",
        value: 20.5,
        description: "test description",
      };

      before(async () => {
        await cleanup(testingTransaction.id);
      });

      after(async () => {
        await cleanup(testingTransaction.id);
      });

      it("Correct error message", async () => {
        let err = 0;
        try {
          await addTransaction(testingTransaction);
        } catch (error) {
          err = 1;
          expect((error.message = "Id must be a string and longer than 0"));
        }
        expect(err).to.equal(1);
      });
    });

    function makeNegativeAddTransactionTestCase({
      testingTransaction,
      testCaseTitle,
      itTitle,
    }) {
      describe(testCaseTitle, () => {
        before(async () => {
          await cleanup(testingTransaction.id);
        });

        after(async () => {
          await cleanup(testingTransaction.id);
        });

        it(itTitle, async () => {
          let err = 0;

          try {
            await addTransaction(testingTransaction);
          } catch (error) {
            err = 1;
            expect(error instanceof InvalidArgumentError);
          }

          expect(err).to.equal(1);
        });
      });
    }

    makeNegativeAddTransactionTestCase({
      testingTransaction: {
        id: "testingTransaction1",
        // transaction_name: "test transaction name 1",
        value: 10,
        description: "test description 1",
      },
      testCaseTitle: "Adding transaction with no transaction_name",
      itTitle: "Correct error type",
    });

    makeNegativeAddTransactionTestCase({
      testingTransaction: {
        id: "testingTransaction1",
        transaction_name: "test transaction name 1",
        // value: 10,
        description: "test description 1",
      },
      testCaseTitle: "Adding transaction with no value",
      itTitle: "Correct error type",
    });

    makeNegativeAddTransactionTestCase({
      testingTransaction: {
        id: "testingTransaction1",
        transaction_name: "test transaction name 1",
        value: -10,
        description: "test description 1",
      },
      testCaseTitle: "Adding transaction with negative value",
      itTitle: "Correct error type",
    });

    makeNegativeAddTransactionTestCase({
      testingTransaction: {
        id: "testingTransaction1",
        transaction_name: "test transaction name 1",
        value: 10,
        description: 211,
      },
      testCaseTitle: "Adding transaction with wrong date type of description",
      itTitle: "Correct error type",
    });
  });

  describe("///// PRIMARY: Testing getTransaction /////", () => {
    const testingTransactionGet = {
      id: "testingTransaction2",
      transaction_name: "transaction name 2",
      value: 20,
      description: "dummy description for getTransaction testing",
    };

    before(async () => {
      await cleanup(testingTransactionGet.id);
      await cleanup("notExistTransaction");
    });

    after(async () => {
      await cleanup(testingTransactionGet.id);
    });

    describe("Testing getting correct transaction", () => {
      it("Returned transaction is equal to testing transaction", async () => {
        await addTransaction(testingTransactionGet);

        const firstTransaction = await getTransaction({
          transactionId: testingTransactionGet.id,
        });

        delete firstTransaction.dt_transaction;

        expect(firstTransaction).to.deep.equal(testingTransactionGet);
      });
    });

    describe("Testing getting transaction that does not exist", () => {
      it("Null is returned", async () => {
        let result = await getTransaction({
          transactionId: "notExistTransaction",
        });

        expect(result).to.equal(null);
      });
    });

    // describe("Testing getting correct transaction for testingTransaction 2", () => {
    //   it("testingTransaction2 returned", async () => {
    //     let result = await getTransaction({
    //       transactionId: "testingTransaction2",
    //     });

    //     expect(result).to.equal("testingTransaction2");
    //   });
    // });
  });

  describe("///// PRIMARY: Testing updateTransaction /////", () => {
    const testingTransaction = {
      id: "testingTransaction1",
      transaction_name: "testTransactionName",
      value: 20.5,
      description: "test description",
    };

    before(async () => {
      await cleanup(testingTransaction.id);
      await addTransaction(testingTransaction);
    });

    after(async () => {
      await cleanup(testingTransaction.id);
    });

    describe("Update transaction correctly", () => {
      let newValue = 235;
      it("Getting correct response", async () => {
        const response = await updateTransaction({
          id: testingTransaction.id,
          newAttributes: {
            value: newValue,
          },
        });
        expect(response.rowCount).to.equal(1);
      });

      it("Transaction in the db as the updated value", async () => {
        const response = await getTransaction({
          transactionId: testingTransaction.id,
        });
        expect(response.value).to.equal(newValue);
      });
    });

    describe("Testing update with empty attribute", () => {
      it("Correct error", async () => {
        let err = 0;
        try {
          await updateTransaction({
            id: testingTransaction.id,
            newAttributes: {},
          });
        } catch (error) {
          err = 1;
          expect(error instanceof InvalidArgumentError);
        }
        expect(err).to.equal(1);
      });
    });

    describe("Testing update with wrong attribute", () => {
      before(async () => {
        await cleanup(testingTransaction.id);
        await addTransaction(testingTransaction);
      });

      it("Correct error response", async () => {
        let err = 0;

        try {
          await updateTransaction({
            id: testingTransaction.id,
            newAttributes: {
              price: 250,
            },
          });
        } catch (error) {
          err = 1;
          expect(error instanceof InvalidArgumentError);
        }

        expect(err).to.equal(1);
      });

      it("Transaction remains unchanged", async () => {
        const response = await getTransaction({
          transactionId: testingTransaction.id,
        });

        delete response.dt_transaction;

        expect(response).to.deep.equal(testingTransaction);
      });
    });

    describe("Update multiple parameters and some do not exist", () => {
      let newValue = 235;
      let newTransactionName = "new transaction name";

      before(async () => {
        await cleanup(testingTransaction.id);
        await addTransaction(testingTransaction);
      });
      it("Correct response", async () => {
        const response = await updateTransaction({
          id: testingTransaction.id,
          newAttributes: {
            transaction_name: newTransactionName,
            value: newValue,
          },
        });

        expect(response.rowCount).to.equal(1);
      });

      it("Transaction attributes is properly updated", async () => {
        const response = await getTransaction({
          transactionId: testingTransaction.id,
        });
        expect(response.transaction_name).to.equal(newTransactionName);
        expect(response.value).to.equal(newValue);
        expect(response.description).to.equal(testingTransaction.description);
      });
    });

    describe("Testing update with id that do not exist", () => {
      before(async () => {
        await cleanup("notExistTransactionId");
      });

      it("Correct error response", async () => {
        const response = await updateTransaction({
          id: "notExistTransactionId",
          newAttributes: {
            value: 200,
          },
        });

        expect(response).to.equal("id not exist");
      });
    });
  });

  describe("///// PRIMARY: Testing deleteTransaction /////", () => {
    const testingTransaction = {
      id: "testingTransaction1",
      transaction_name: "testTransactionName",
      value: 20.5,
      description: "test description",
    };

    before(async () => {
      await cleanup(testingTransaction.id);
      await addTransaction(testingTransaction);
    });

    after(async () => {
      await cleanup(testingTransaction.id);
    });

    describe("Correct delete", () => {
      it("Correct response", async () => {
        let response = await deleteTransaction({
          transactionId: testingTransaction.id,
        });
        expect(response.rowCount).to.equal(1);
      });

      it("Transaction does not exist anymore", async () => {
        let response = await getTransaction({
          transactionId: testingTransaction.id,
        });
        expect(response).to.equal(null);
      });
    });

    describe("Delete transaction that does not exist", () => {
      async function getCount() {
        const count = await client.query(`
          select count(*) as count
          from transactions
        `);

        return count.rows[0].count;
      }

      it("Count before deleting is equal to count after deleting", async () => {
        let countBefore = await getCount();
        await deleteTransaction({ transactionId: "doesNotExist" });
        let countAfter = await getCount();

        expect(countAfter).to.equal(countBefore);
      });
    });
  });

  describe("///// PRIMARY: Testing getTransactions /////", () => {
    const testingTransaction1 = {
      id: "testingTransaction1",
      transaction_name: "testTransactionName1",
      value: 20.5,
      description: "test description",
    };
    const testingTransaction2 = {
      id: "testingTransaction2",
      transaction_name: "testTransactionName2",
      value: 40,
      description: "test description",
    };
    const testingTransaction3 = {
      id: "testingTransaction3",
      transaction_name: "testTransactionName3",
      value: 0,
    };

    before(async () => {
      await Promise.all([
        cleanup(testingTransaction1.id),
        cleanup(testingTransaction2.id),
        cleanup(testingTransaction3.id),
      ]);

      await Promise.all([
        addTransaction(testingTransaction1),
        addTransaction(testingTransaction2),
        addTransaction(testingTransaction3),
      ]);
    });

    after(async () => {
      await Promise.all([
        cleanup(testingTransaction1.id),
        cleanup(testingTransaction2.id),
        cleanup(testingTransaction3.id),
      ]);
    });

    describe("Testing if transaction are returned", () => {
      let transactions;
      before(async () => {
        transactions = await getTransactions({});
      });

      it("Transaction1 are the same in testing", async () => {
        const transaction1 = transactions.filter(
          (transaction) => transaction.id === testingTransaction1.id
        )[0];
        delete transaction1.dt_transaction;
        expect(transaction1).to.deep.equal(testingTransaction1);
      });

      it("Transaction2 are the same in testing", async () => {
        const transaction2 = transactions.filter(
          (transaction) => transaction.id === testingTransaction2.id
        )[0];
        delete transaction2.dt_transaction;
        expect(transaction2).to.deep.equal(testingTransaction2);
      });

      it("Transaction3 are the same in testing", async () => {
        const transaction3 = transactions.filter(
          (transaction) => transaction.id === testingTransaction3.id
        )[0];
        delete transaction3.dt_transaction;
        delete transaction3.description;
        expect(transaction3).to.deep.equal(testingTransaction3);
      });
    });

    describe("Testing limit", () => {
      it("Correct number is returned", async () => {
        let testLimit = 5;
        const response = await getTransactions({ limit: testLimit });
        // console.log(
        //   util.inspect(response, false, null, true /* enable colors */)
        // );
        expect(response.length).to.equal(testLimit);
      });

      it("Correct number is returned", async () => {
        let limit = 3;
        const response = await getTransactions({ limit });
        expect(response.length).to.equal(limit);
      });

      describe("Testing sorting ascending", () => {
        it("Lowest value is passed in", async () => {
          let sortBy = "value";
          const response = await getTransactions({
            sortBy,
            desc: false,
          });

          const minValue = await client.query(`
            select min(value) as minvalue
            from transactions
          `);
          expect(response[0].value).to.equal(minValue.rows[0].minvalue);
        });
      });

      describe("Testing sorting descending", () => {
        it("Highest value is passed in", async () => {
          let sortBy = "value";
          const response = await getTransactions({
            sortBy,
            desc: true,
          });

          const maxValue = await client.query(`
            select max(value) as maxvalue
            from transactions
          `);
          expect(response[0].value).to.equal(maxValue.rows[0].maxvalue);
        });
      });

      describe("Testing offset", () => {
        let limit = 1;
        it("Correct value is returned", async () => {
          const response = await getTransactions({
            limit,
            sortBy: "value",
            desc: true,
            offset: 1,
          });

          const valueReturned = await client.query(
            `
            select value
            from transactions
            order by value desc
            limit $1 offset 1
          `,
            [limit]
          );

          expect(response[0].value).to.equal(valueReturned.rows[0].value);
        });
      });
    });
  });
});
