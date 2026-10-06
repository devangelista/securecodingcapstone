/* The ResearchDAO must be constructed with a connected database object */
function ResearchDAO(db) {

    "use strict";

    /* If this constructor is called without the "new" operator, "this" points
     * to the global object. Log a warning and call it correctly. */
    if (false === (this instanceof ResearchDAO)) {
        console.log("Warning: ResearchDAO constructor called without 'new' operator");
        return new ResearchDAO(db);
    }

    this.getBySymbol = (symbol, callback) => {
        if (typeof callback === "function") {
            callback(null, symbol ? { symbol: symbol } : null);
        }
    };
}

module.exports = { ResearchDAO };
