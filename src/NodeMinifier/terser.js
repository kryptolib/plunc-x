const Terser = require("terser");
const fs = require('fs')
const code = fs.readFileSync(__dirname + '/src.js').toString();
const options = {
    mangle: {
        reserved: JSON.parse(process.argv[2])
    }
};
Terser.minify(code, options).then(result => {
  fs.writeFileSync(__dirname + '/min.js', result.code)
});