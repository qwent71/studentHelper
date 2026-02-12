import { nextJsConfig } from "@student-helper/eslint/next-js";
import boundaries from "eslint-plugin-boundaries";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    plugins: {
      boundaries,
    },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**" },
        { type: "widgets", pattern: "src/widgets/**" },
        { type: "features", pattern: "src/features/**" },
        { type: "entities", pattern: "src/entities/**" },
        { type: "shared", pattern: "src/shared/**" },
      ],
      "boundaries/ignore": ["app/**", "middleware.ts"],
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            { from: "app", allow: ["widgets", "features", "entities", "shared"] },
            { from: "widgets", allow: ["features", "entities", "shared"] },
            { from: "features", allow: ["entities", "shared"] },
            { from: "entities", allow: ["shared"] },
            { from: "shared", allow: [] },
          ],
        },
      ],
    },
  },
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/features/*/ui/*",
                "@/features/*/model/*",
                "@/features/*/lib/*",
                "@/features/*/api/*",
                "@/features/*/*/ui/*",
                "@/features/*/*/model/*",
                "@/features/*/*/lib/*",
                "@/features/*/*/api/*",
              ],
              message: "Import from the slice public API (index.ts), not from internal segments.",
            },
            {
              group: ["@/entities/*/ui/*", "@/entities/*/model/*", "@/entities/*/lib/*", "@/entities/*/api/*"],
              message: "Import from the slice public API (index.ts), not from internal segments.",
            },
            {
              group: ["@/widgets/*/ui/*", "@/widgets/*/model/*", "@/widgets/*/lib/*", "@/widgets/*/api/*"],
              message: "Import from the slice public API (index.ts), not from internal segments.",
            },
          ],
        },
      ],
    },
  },
];
