module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/strict",
    "plugin:@typescript-eslint/stylistic",
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        prefer: "type-imports",
        fixStyle: "inline-type-imports",
      },
    ],
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-duplicate-imports": "error",
    eqeqeq: ["error", "always"],
    curly: ["error", "all"],
    "no-throw-literal": "error",
    "prefer-const": "error",
  },
  ignorePatterns: [
    "dist",
    "build",
    ".next",
    "node_modules",
    "coverage",
    "prisma/migrations",
    "*.js",
  ],
};
