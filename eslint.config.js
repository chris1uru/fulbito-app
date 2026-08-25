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
      // Estas reglas experimentales de React 19 marcan flujos validos de React Native
      // (carga de datos al cambiar una seleccion y comparaciones con la hora actual).
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
