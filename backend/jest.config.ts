import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.ts"],
  setupFiles: ["<rootDir>/jest.setup.ts"],
};

export default config;