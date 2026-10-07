#!/usr/bin/env nodejs

"use strict";

// This script initializes the database. You can set the environment variable
// before running it (default: development). ie:
// NODE_ENV=production node artifacts/db-reset.js

const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt-nodejs");
const { db } = require("../config/config");

const hashPassword = (password) => bcrypt.hashSync(password, bcrypt.genSaltSync());

const USERS_TO_INSERT = [
    {
        "_id": 1,
        "userName": "admin",
        "firstName": "Node Goat",
        "lastName": "Admin",
        "password": hashPassword("Admin_123"),
        //"password" : "$2a$10$8Zo/1e8KM8QzqOKqbDlYlONBOzukWXrM.IiyzqHRYDXqwB3gzDsba", // Admin_123
        "isAdmin": true
    }, {
        "_id": 2,
        "userName": "user1",
        "firstName": "John",
        "lastName": "Doe",
        "benefitStartDate": "2030-01-10",
        "password": hashPassword("User1_123")
        // "password" : "$2a$10$RNFhiNmt2TTpVO9cqZElb.LQM9e1mzDoggEHufLjAnAKImc6FNE86",// User1_123
    }, {
        "_id": 3,
        "userName": "user2",
        "firstName": "Will",
        "lastName": "Smith",
        "benefitStartDate": "2025-11-30",
        "password": hashPassword("User2_123")
        //"password" : "$2a$10$Tlx2cNv15M0Aia7wyItjsepeA8Y6PyBYaNdQqvpxkIUlcONf1ZHyq", // User2_123
    }];

const tryDropCollection = async (database, name) => {
    try {
        await database.dropCollection(name);
        console.log(`Dropped collection: ${name}`);
    } catch (err) {
        // A missing collection is expected on the first seed.
    }
}

const parseResponse = (err, res, comm) => {
    if (err) {
        console.log("ERROR:");
        console.log(comm);
        console.log(JSON.stringify(err));
        process.exit(1);
    }
    console.log(comm);
    console.log(JSON.stringify(res));
}


const resetDatabase = async () => {
    const client = new MongoClient(db);
    try {
        await client.connect();
    } catch (err) {
        console.log("ERROR: connect");
        console.log(JSON.stringify(err));
        process.exit(1);
    }
    console.log("Connected to the database");

    const database = client.db();
    const collectionNames = [
        "users",
        "allocations",
        "contributions",
        "memos",
        "counters"
    ];

    console.log("Dropping existing collections");
    await Promise.all(collectionNames.map((name) => tryDropCollection(database, name)));

    const usersCol = database.collection("users");
    const allocationsCol = database.collection("allocations");
    const countersCol = database.collection("counters");

    try {
        const counterResult = await countersCol.insertOne({
            _id: "userId",
            seq: 3
        });
        parseResponse(null, counterResult, "countersCol.insert");
    } catch (err) {
        parseResponse(err, null, "countersCol.insert");
    }

    console.log("Users to insert:");
    USERS_TO_INSERT.forEach((user) => console.log(JSON.stringify(user)));

    let userResult;
    try {
        userResult = await usersCol.insertMany(USERS_TO_INSERT);
    } catch (err) {
        console.log("ERROR: insertMany");
        console.log(JSON.stringify(err));
        process.exit(1);
    }
    parseResponse(null, userResult, "users.insertMany");

    const finalAllocations = USERS_TO_INSERT.map((user) => {
        const stocks = Math.floor((Math.random() * 40) + 1);
        const funds = Math.floor((Math.random() * 40) + 1);
        return {
            userId: user._id,
            stocks: stocks,
            funds: funds,
            bonds: 100 - (stocks + funds)
        };
    });

    console.log("Allocations to insert:");
    finalAllocations.forEach(allocation => console.log(JSON.stringify(allocation)));

    try {
        const allocationResult = await allocationsCol.insertMany(finalAllocations);
        parseResponse(null, allocationResult, "allocations.insertMany");
    } catch (err) {
        parseResponse(err, null, "allocations.insertMany");
    }

    console.log("Database reset performed successfully");
    await client.close();
};

module.exports = { resetDatabase };

if (require.main === module) {
    resetDatabase().then(() => {
        // Render does not run the Docker Command through a shell, so
        // "node artifacts/db-reset.js && node server.js" never reaches server.js.
        if (process.argv.indexOf("&&") !== -1) {
            require("../server.js");
            return;
        }
        process.exit(0);
    }).catch((err) => {
        console.log("ERROR: reset");
        console.log(JSON.stringify(err));
        process.exit(1);
    });
}
