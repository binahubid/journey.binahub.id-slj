import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";

const compat = new FlatCompat({
  baseDirectory: fileURLToPath(new URL(".", import.meta.url)),
});
export default [
  { ignores: ["node_modules/**", ".next/**", "supabase/**", "tmp/**"] },
  ...compat.config({
    extends: ["next/core-web-vitals"],
    plugins: ["@typescript-eslint"],
    rules: { "@next/next/no-img-element": "off" },
  }),
];
