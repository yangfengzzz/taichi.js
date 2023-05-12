import { error } from "@taichi.js/core";
import { test2DField } from "./Test2DField";

export async function runAllTests() {
  let passed = true;
  passed &&= await test2DField();

  if (passed) {
    console.log("All tests passed");
  } else {
    error("TESTS FAILED");
  }
}
