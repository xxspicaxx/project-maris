module.exports = {
  extends: ["./base.js"],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    // Disable explicit return types for NestJS since services and controllers rely on type inference
    "@typescript-eslint/explicit-function-return-type": "off",
  },
  overrides: [
    {
      files: ["**/*.spec.ts", "**/__tests__/**/*.ts", "test/**/*.ts"],
      env: {
        jest: true,
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "off",
      },
    },
  ],
};
