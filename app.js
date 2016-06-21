/**
 * Created by Ankush on 6/20/16.
 */

var express = require("express");
var bodyParser = require("body-parser");
var async = require("async");
var r = require("rethinkdb");

var config = require(__dirname + '/config.js');

var app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));

app.use(express.static("./public"));

app.route('/usermail-api')
    .get(listUsersfromDB)
    .post(addUsertoDB);

app.delete("/usersearch-api/:id", function (req, res) {
    var userID = req.params.id;
    console.log(userID);
    r.table("userinfo").filter(r.row("email").eq(userID)).run(req.app._rdbConn, function(err, result){
        if(err) {
            return next(err);
        }

        result.toArray(function(err, jresult) {
            if(err) {
                return next(err);
            }
            console.log("result to push" + jresult);
            res.json(jresult);
        });

    });
});


function startExpress(connection) {
    app._rdbConn = connection;
    app.listen(config.express.port);
    console.log('Listening on port ' + config.express.port);
}

function addUsertoDB(req, res, next) {
    var user = req.body;
    user.createdAt = r.now();
    console.dir(user);

    r.table('userinfo').insert(user, {returnChanges: true}).run(req.app._rdbConn, function(err, result) {
        if(err) {
            return next(err);
        }

        //res.json(result.changes[0].new_val);
        listUsersfromDB(req, res, next);
    });
}

function listUsersfromDB(req, res, next) {
    r.table('userinfo').orderBy({index: 'createdAt'}).run(req.app._rdbConn, function(err, cursor) {
        if(err) {
            return next(err);
        }

        //Retrieve all the todos in an array.
        cursor.toArray(function(err, result) {
            if(err) {
                return next(err);
            }

            res.json(result);
        });
    });
}

async.waterfall([
    function connect(callback) {
        r.connect(config.rethinkdb, callback);
    },
    function createDatabase(connection, callback) {
        //Create the database if needed.
        r.dbList().contains(config.rethinkdb.db).do(function(containsDb) {
            return r.branch(
                containsDb,
                {created: 0},
                r.dbCreate(config.rethinkdb.db)
            );
        }).run(connection, function(err) {
            callback(err, connection);
        });
    },
    function createTable(connection, callback) {
        //Create the table if needed.
        r.tableList().contains('userinfo').do(function(containsTable) {
            return r.branch(
                containsTable,
                {created: 0},
                r.tableCreate('userinfo')
            );
        }).run(connection, function(err) {
            callback(err, connection);
        });
    },
    function createIndex(connection, callback) {
        //Create the index if needed.
        r.table('userinfo').indexList().contains('createdAt').do(function(hasIndex) {
            return r.branch(
                hasIndex,
                {created: 0},
                r.table('userinfo').indexCreate('createdAt')
            );
        }).run(connection, function(err) {
            callback(err, connection);
        });
    },
    function waitForIndex(connection, callback) {
        //Wait for the index to be ready.
        r.table('userinfo').indexWait('createdAt').run(connection, function(err, result) {
            callback(err, connection);
        });
    }
], function(err, connection) {
    if(err) {
        console.error(err);
        process.exit(1);
        return;
    }

    startExpress(connection);
});

