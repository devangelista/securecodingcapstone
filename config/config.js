const _ = require("underscore");
const path = require("path");
const util = require('util')

const finalEnv = process.env.NODE_ENV || "development";

const allConf = require(path.resolve(__dirname + "/../config/env/all.js"))
const envConf = require(path.resolve(__dirname + "/../config/env/" + finalEnv.toLowerCase() + ".js")) || {}

const config = { ...allConf, ...envConf }

const printable = { ...config };
["db", "cookieSecret", "cryptoKey"].forEach((key) => {
    if (printable[key]) printable[key] = "[redacted]";
});

console.log(`Current Config:`)
console.log(util.inspect(printable, false, null))

module.exports = config;
