const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

module.exports = myCache;
