const { defineConfig, globalIgnores } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");

module.exports = defineConfig([
  globalIgnores([
    ".expo/*",
    "dist/*",
    ".codex-export-*/*",
    "nativewind-env.d.ts",
  ]),
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    rules: {
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
]);
