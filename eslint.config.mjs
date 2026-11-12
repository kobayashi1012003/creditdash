import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Nothing outside lib/data touches storage (CLAUDE.md, "The data layer").
  // The exceptions hold per-browser conveniences, never user data: a
  // remembered card or panel, the demo banner, and the first card's art.
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    ignores: [
      "lib/data/**",
      "lib/use-stored-value.ts",
      "lib/use-stored-flag.ts",
      "lib/demo-banner.ts",
      "scripts/**",
    ],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "localStorage", message: "Read and write through lib/data, or lib/use-stored-* for UI state." },
        { name: "sessionStorage", message: "Read and write through lib/data, or lib/use-stored-* for UI state." },
      ],
      "no-restricted-properties": [
        "error",
        { object: "window", property: "localStorage", message: "Read and write through lib/data, or lib/use-stored-* for UI state." },
        { object: "window", property: "sessionStorage", message: "Read and write through lib/data, or lib/use-stored-* for UI state." },
      ],
    },
  },
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Build output and vendored content that is not ours to lint.
    ".open-next/**",
    ".wrangler/**",
    "node_modules/**",
    ".agents/**",
    // Private card data study (git-ignored), throwaway scripts.
    "study/**",
    ".claude/**",
  ]),
]);

export default eslintConfig;
