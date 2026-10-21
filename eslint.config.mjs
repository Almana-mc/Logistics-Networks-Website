import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "jsx/**",
      "js/**",
      ".*/**",
      "artifacts/**",
      "test-results/**",
    ],
  },
  {
    ...js.configs.recommended,
    files: ["scripts/**/*.mjs", "*.mjs", "lib/**/*.js"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["{views,components,lib,server}/**/*.{ts,tsx}"],
    rules: {
      "max-lines": ["error", 250],
      "max-lines-per-function": ["error", 40],
    },
  },
  {
    files: ["**/*.{ts,tsx,js,mjs}"],
    languageOptions: {
      globals: Object.fromEntries(
        [
          "window",
          "document",
          "location",
          "localStorage",
          "fetch",
          "URL",
          "console",
          "process",
          "Buffer",
          "setTimeout",
          "clearTimeout",
          "AbortController",
        ].map((key) => [key, "readonly"]),
      ),
    },
  },
);
