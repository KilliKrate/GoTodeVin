var express = require('express');
var app = express();

const db = require('better-sqlite3')('./resources/data/GoToDeDB.db');

function verificaDisponibilita(quantita, nome){
    db.all("SELECT disponibilita FROM Vini WHERE nome=\""+nome+"\"", (err, rows) => {
        disponibilita = rows["disponibilita"];
    });
    return (disponibilita>=quantita);
}

var cors = require('cors');
app.use(cors());

// module to parse the API body request
var bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
    res.send('Hello World!');
});

//CATALOGO

app.get('/catalogo/vini', function (req, res) { //VINI O VINO?
    let sql = "SELECT nome FROM Vini WHERE disponibilita > 0"; 
    res.send(db.prepare(sql).all());
});

app.get('/catalogo/ricerca', function (req, res) { //VINI O VINO?
    let sql = "SELECT * FROM Vini WHERE disponibilita > 0"; //assumo che questa funzione non possa essere chiamata senza almeno un criterio di ricerca

    let nome=req.body['nome'], annata=req.body['annata'];
    if(nome!="") {
        sql += " AND nome LIKE \"%"+nome+"%\""; //NON DEVE ESSERE ESATTAMENTE QUELLO
    }
    if(annata!="") sql += " AND annata = "+annata;

    res.send(db.prepare(sql).all());
});

app.get('/catalogo/dettaglio/:name', function (req, res) {
    let sql = "SELECT * FROM Vini WHERE nome = \""+req.params.name+"\""; //VINI O VINO?
    res.send(db.prepare(sql).all());
});

app.post('')

//ASSISTENZA

app.get('/assistenza', function (req, res) {
    let sql = "SELECT * FROM Assistenza"; //VERIFICARE NOME TABELLA
    res.send(db.prepare(sql).all());
});

//ORDINI

app.get('/ordini/:email', function (req,res) {
    let sql = "SELECT id, tipo, stato, data_creazione, data_ritirabile FROM Ordini WHERE proprietario=\""+req.params.email+"\"";
    res.send(db.prepare(sql).all());
})

app.get('/ordini/dettaglio/:id', function (req,res) {
    let idOrdine = req.params.id;
    let sql = "SELECT * FROM `composto da` WHERE id_ordine="+idOrdine;
    let vini = db.prepare(sql).all();

    sql = "SELECT * FROM Ordini WHERE id="+idOrdine+" LIMIT 1";
    let ordine = db.prepare(sql).all();

    ordine[0].items = vini;

    res.send(ordine);
})

//CARRELLO

app.post('/carrello/modifica', function (req, res) { //dovrei fare una seconda funzione dedicata per l'eliminazione?
    let sql, quantita = req.body['quantita'], nomeVino = req.body['nomeVino'], utente = req.body['email'], eseguiSql=true;

    if (quantita = 0) sql = "DELETE FROM `in carrello` WHERE nome_vino="+nomeVino+" AND proprietario = \""+utente+"\"";
    else {
        if (verificaDisponibilita(quantita, nomeVino)) sql = "UPDATE `in carrello` SET quantita="+quantita+" WHERE nome_vino="+nomeVino+" AND proprietario = \""+utente+"\"";
        else {
            res.send("disponibilità insufficiente");
            eseguiSql= false;
        }
    }

    if(eseguiSql){
        db.prepare(sql);
    }
});

app.get('/carrello/preordina', function (req, res) {
    let utente = req.body['email'], aggiungiPreordine = true;
    let prodotti = db.prepare("SELECT * FROM `in carrello` WHERE proprietario=\""+utente+"\"").all();
    prodotti.forEach((elem)=>{
        if(!verificaDisponibilita(elem['quantita'],elem['nome_vino'])){
            aggiungiPreordine=false;
        }
    })
    if (aggiungiPreordine) {
        db.prepare("DELETE FROM `in carrello` WHERE proprietario=\""+utente+"\"");
    }
});

app.listen(8080, function () {
    console.log('GoTodeVin listening on port 8080!');
});