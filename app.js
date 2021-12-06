var express = require('express');
var app = express();

var sqlite = require('sqlite3');
const db = new sqlite.Database('./GoToDeDB.db');

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
    let sql = "SELECT nome FROM Vini"; //non devo inviarti tutto quello lo faccio nel dettaglio giusto?
    db.all(sql, (err, rows) => {
        res.send(rows);
    })
});

app.get('/catalogo/ricerca', function (req, res) {
    let sql = "SELECT * FROM Vini WHERE"; //assumo che questa funzione non possa essere chiamata senza almeno un criterio di ricerca

    let nome=req.body['Name'], annata=req.body['Annata'];
    if(nome!="") {
        sql += " nome LIKE \"%"+nome+"%\"";
        if(annata!="") sql += " AND";
    }
    if(annata!="") sql += " annata = "+annata;

    db.all(sql, (err, rows) => {
        res.send(rows);
    })
})

app.get('/catalogo/dettaglio/:name', function (req, res) {
    let sql = "SELECT * FROM Vini WHERE nome = \""+req.params.name+"\"";
    db.all(sql, (err, rows) => {
        res.send(rows);
    })
})

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});