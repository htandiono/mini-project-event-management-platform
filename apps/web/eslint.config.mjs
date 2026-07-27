import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.mjs", "*.ts", "*.js"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  globalIgnores([".next/**", "coverage/**", "next-env.d.ts"]),
]);
