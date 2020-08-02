const fs = require("fs");
const { create } = require("domain");
const babylon = require("@babel/parser");
const traverse = require("@babel/traverse").default;

let ID = 0;

//start creating assets from the entry file:
function createAssets(filename) {
  const content = fs.readFileSync(filename, "utf-8");
  const ast = babylon.parse(content, {
    sourceType: "module",
  });

  const dependencies = [];

  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependencies.push(node.source.value);
    },
  });

  const id = ID++;
  return {
    id,
    filename,
    dependencies,
  };
}

const main = createAssets("./example/entry.js");
console.log(main);
