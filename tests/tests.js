import { runAllTests } from "./src/All";

console.log("running tests");

let main = async () => {
  await runAllTests();
  console.log("Running examples");
};
main();
