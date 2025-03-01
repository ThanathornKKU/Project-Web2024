import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn", // เปลี่ยนจาก error -> warn
      "@typescript-eslint/no-explicit-any": "off", // ปิดการเตือน any
      "react-hooks/exhaustive-deps": "warn", // แค่เตือน useEffect dependencies
      "@next/next/no-img-element": "warn" // ไม่บังคับใช้ <Image />
    },
  },
];

export default eslintConfig;
