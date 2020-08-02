const fs = require("fs");
const { create } = require("domain");
const babylon = require("@babel/parser");

function createAssets(filename) {
  const content = fs.readFileSync(filename, "utf-8");
  const ast = babylon.parse(content, {
    sourceType: "module",
  });
  console.log(ast);
}

createAssets("./example/entry.js");
