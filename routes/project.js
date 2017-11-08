var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();

// get the applications configuration
var config = require("../config.js");

// connect to the database (https://node-postgres.com)
var pg = require('pg');
// create a pg pool
const { Client } = require('pg');

// create application/json parser
var jsonParser = bodyParser.json()

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// request activity record
router.post('/projects', jsonParser, function (req, res) {
    try {

        // validate databaseId
        var databaseId = req.body.databaseId;
        if (typeof databaseId !== 'number') {
            res.status(400).json({ errCode: 400, status: "ERROR", message: "You must specify a databaseId as an integer in the JSON of your HTTP POST." });
            return;
        }

        // validate pg object in the config by the databaseId
        if (typeof config.pg[databaseId] !== 'object') {
            res.status(400).json({ errCode: 400, status: "ERROR", message: "Your databaseId does not correspond to a valid database instance." });
            return;
        }

        // create connection to database
        var connectionString = "postgres://" + config.pg[databaseId].user + ":" +
            config.pg[databaseId].password + "@" +
            config.pg[databaseId].host + "/" + config.pg[databaseId].database;

        const client = new Client({ connectionString: connectionString });

        // make a simple select query
        client.connect()
            .then(function () {
                client.query('SELECT * FROM project')
                    .then(function (result) {
                        var json = JSON.stringify(result.rows);
                        res.writeHead(200, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(json) });
                        res.end(json);
                    })
                    .catch(function (error) {
                        res.status(500).json({ errCode: 500, status: "ERROR", message: "There was an error in the execution of API request. Contact the administrator. Message:" + error });
                        return;
                    })
                    .then(() => client.end());
            })
            .catch(function (error) {
                res.status(500).json({ errCode: 500, status: "ERROR", message: "There was an error in the execution of API request. Contact the administrator. Message:" + error });
                return;
            });
    }
    catch (ex) {
        res.status(500).json({ errCode: 500, status: "ERROR", message: "There was an error in the execution of API request. Contact the administrator. Message:" + ex });
        return;
    }
});


module.exports = router;