var express = require('express');
var app = express();

var sqlite = require('sqlite3');
const db = await sqlite.open({
    filename: './NOME_DATABASE.db',
    driver: sqlite3.Database
});

var cors = require('cors');
app.use(cors());

// module to parse the API body request
var bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.get('/catalogo/vini', function (req, res) {

});

app.listen(8080, function () {
    console.log('GoTodeVin listening on port 8080!');
});