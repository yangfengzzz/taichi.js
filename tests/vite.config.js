import taichi from "../rollup-plugin-taichi/dist/rollup-plugin-taichi.js";
import { defineConfig } from "vite";

function endWith(str, substr) {
  return str.slice(-substr.length) === substr;
}

export default defineConfig({
  plugins: [
    {
      ...taichi({
        exclude: (f) => {
          return endWith(f, ".js");
        }
      }),
      enforce: "pre"
    }
  ]
});
