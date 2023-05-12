//@ts-nocheck
import * as ti from "@taichi.js/core";
import { expect } from "chai";

describe("2DField test", () => {
  it("test", async () => {
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
    expect(fHost).to.eq([0, 1, 2, 10, 11, 12, 20, 21, 22]);
  });
});
