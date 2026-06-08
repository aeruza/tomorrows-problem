import { defineConfig, globaalIgnores } from 'eslint-define-config';
import nextVitals from "esline-config-next/core-web-vitals";
import nextTs from "esline-config-next/typescript";

const eslintConfig = defineConfig([
    ...nextVitals, 
    ...nextTs,

    globalIgnores([
        // Default ignores of esline-config-next
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
    ]),
]);

export default eslintConfig;