const { expect } = require("chai");
const InvalidArgumentError = require("../app/error");

describe("Testing custom error", () => {
  const customeMessage = "Custom message";
  const newError = new InvalidArgumentError(customeMessage);

  it("Custom error is instanceof Error", () => {
    expect(newError instanceof Error).to.true;
  });

  it("Name is set correctly", () => {
    expect(newError.name).to.equal("InvalidArgumentError");
  });

  it("Message is set correctly", () => {
    expect(newError.message).to.equal(customeMessage);
  });
});
