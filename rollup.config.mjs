import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { readFileSync } from "node:fs"
import ts from "rollup-plugin-typescript2"
import replace from "@rollup/plugin-replace"
import terser from "@rollup/plugin-terser"

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf8"))

const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * (c) ${new Date().getFullYear()} fineanmol
 * @license MIT
 */`

const DEV_REPLACE = replace({
  preventAssignment: true,
  values: { __DEV__: "(process.env.NODE_ENV !== 'production')" },
})

const PROD_REPLACE = replace({
  preventAssignment: true,
  values: { __DEV__: "false" },
})

const tsPlugin = ts({
  tsconfig: resolve(__dirname, "tsconfig.json"),
  tsconfigOverride: {
    compilerOptions: { declaration: true, declarationMap: true },
  },
})

const tsProdPlugin = ts({
  tsconfig: resolve(__dirname, "tsconfig.json"),
  tsconfigOverride: {
    compilerOptions: { declaration: false },
  },
})

const external = ["vue"]

export default [
  // ESM for bundlers (preserves __DEV__ for tree-shaking)
  {
    input: "src/index.ts",
    external,
    plugins: [tsPlugin, DEV_REPLACE],
    output: {
      file: pkg.module,
      format: "esm",
      banner,
      sourcemap: false,
    },
  },
  // CJS for Node / require()
  {
    input: "src/index.ts",
    external,
    plugins: [tsProdPlugin, DEV_REPLACE],
    output: {
      file: pkg.main,
      format: "cjs",
      banner,
      exports: "named",
      sourcemap: false,
    },
  },
  // CJS production (minified, __DEV__=false)
  {
    input: "src/index.ts",
    external,
    plugins: [tsProdPlugin, PROD_REPLACE, terser()],
    output: {
      file: "dist/focus-trap-vue.cjs.prod.js",
      format: "cjs",
      banner,
      exports: "named",
      sourcemap: false,
    },
  },
  // IIFE for CDN / <script> tags
  {
    input: "src/index.ts",
    plugins: [tsProdPlugin, PROD_REPLACE, terser()],
    output: {
      file: "dist/focus-trap-vue.global.js",
      format: "iife",
      name: "FocusTrapVue",
      banner,
      globals: { vue: "Vue" },
      exports: "named",
      sourcemap: false,
    },
  },
]
