module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  testMatch: ["**/__tests__/**/*.test.js"],
  moduleFileExtensions: ["js", "jsx", "json"],
  clearMocks: true,
};
