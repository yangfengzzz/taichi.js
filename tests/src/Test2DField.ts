//@ts-nocheck
import * as ti from "@taichi.js/core";
import { assertEqual } from "./Utils";

async function test2DField(): Promise<boolean> {
  console.log("test2DField");

  await ti.init();

  let f = ti.field(ti.i32, [3, 3]);
  ti.addToKernelScope({ f });

  let kernel = ti.kernel(function k() {
    for (let i of ti.range(3)) {
      for (let j of ti.range(3)) {
        f[[i, j]] = i * 10 + j;
      }
    }
  });

  kernel();

  let fHost = await f.toArray1D();

  console.log(fHost);
  return assertEqual(fHost, [0, 1, 2, 10, 11, 12, 20, 21, 22]);
}

export { test2DField };
