const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 7200, checkperiod: 10800 });

module.exports = myCache;
