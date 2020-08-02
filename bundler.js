const fs = require("fs");
const { create } = require("domain");
const babylon = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const path = require("path");
const babel = require("@babel/core");

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
  const code = babel.transformFromAst(ast, null, {
    presets: ["@babel/env"],
  });

  return {
    id,
    filename,
    code,
    dependencies,
  };
}
let results = [];
function createGraph(entry) {
  const main = createAssets(entry);
  //recursively produce the total assets by going into the dependencies of each
  //base case: if no more dependencies OR already visited, then return
  //[{id = 0, filename: "entry", dep: "./message"}, {id = 1, filanem: "message", dep: "./name"}]
  let dep = main.dependencies;
  main.mapping = {};
  if (!dep.length || results.length === main.id + 1) {
    return main.id;
  } else {
    results.push(main);
    let dirname = path.dirname(main.filename);
    for (let i = 0; i < dep.length; i++) {
      let absolutePath = path.join(dirname, dep[i]);
      let childId = createGraph(absolutePath);
      main.mapping[dep[i]] = childId;
      return main.id;
    }
  }
}

function bundle(graph) {
  let modules = "";
  graph.forEach((mod) => {
    modules += `${mod.id}: [
        function(require, module, exports){
            ${mod.code}
        },
        ${JSON.stringify(mod.mapping)}
        ],`;
  });

  let result = `(function(modules){
   function require(id){
    const [fn, mapping] = modules[id];
    function localRequire(relativePath){
        return require(mapping[relativePath])
    }
    const module = {exports :{}}
    fn(localRequire, module, exports);
    return module.exports;
   }
   require(0)

  })({
        ${modules}
    })`;

  return result;
}

createGraph("./example/entry.js");
let bundled = bundle(results);
console.log(bundled);
