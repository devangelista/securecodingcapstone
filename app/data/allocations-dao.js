const UserDAO = require("./user-dao").UserDAO;

/* The AllocationsDAO must be constructed with a connected database object */
const AllocationsDAO = function(db){

    "use strict";

    /* If this constructor is called without the "new" operator, "this" points
     * to the global object. Log a warning and call it correctly. */
    if (false === (this instanceof AllocationsDAO)) {
        console.log("Warning: AllocationsDAO constructor called without 'new' operator");
        return new AllocationsDAO(db);
    }

    const allocationsCol = db.collection("allocations");
    const userDAO = new UserDAO(db);

    this.update = (userId, stocks, funds, bonds, callback) => {
        const parsedUserId = parseInt(userId);

        // Create allocations document
        const allocations = {
            userId: userId,
            stocks: stocks,
            funds: funds,
            bonds: bonds
        };

        allocationsCol.replaceOne({
            userId: parsedUserId
        }, allocations, {
            upsert: true
        }).then(() => {
            console.log("Updated allocations");

            userDAO.getUserById(userId, (err, user) => {

                if (err) return callback(err, null);

                allocations.userId = userId;
                allocations.userName = user.userName;
                allocations.firstName = user.firstName;
                allocations.lastName = user.lastName;

                return callback(null, allocations);
            });
        }).catch((err) => callback(err, null));
    };

    this.getByUserIdAndThreshold = (userId, threshold, callback) => {
        const parsedUserId = parseInt(userId);

        const searchCriteria = () => {

            if (threshold) {
                const parsedThreshold = parseInt(threshold, 10);

                if (parsedThreshold >= 0 && parsedThreshold <= 99) {
                    return {
                        userId: parsedUserId,
                        stocks: {
                            $gt: parsedThreshold
                        }
                    };
                }
                return {
                    userId: parsedUserId,
                    stocks: {
                        $gt: 101
                    }
                };
            }
            return {
                userId: parsedUserId
            };
        }

        allocationsCol.find(searchCriteria()).toArray().then((allocations) => {
            if (!allocations.length) return callback(null, []);

            let doneCounter = 0;
            const userAllocations = [];

            allocations.forEach( alloc => {
                userDAO.getUserById(alloc.userId, (err, user) => {
                    if (err) return callback(err, null);

                    alloc.userName = user.userName;
                    alloc.firstName = user.firstName;
                    alloc.lastName = user.lastName;

                    doneCounter += 1;
                    userAllocations.push(alloc);

                    if (doneCounter === allocations.length) {
                        callback(null, userAllocations);
                    }
                });
            });
        }).catch((err) => callback(err, null));
    };

}

module.exports.AllocationsDAO = AllocationsDAO;
