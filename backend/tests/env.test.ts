
describe("Test environment configuration", () => {
    it("loads the test database URI", () => {
      expect(process.env.DATABASE_URI).toBeTruthy();
      expect(process.env.NODE_ENV).toBe("test");
    });
  });
  