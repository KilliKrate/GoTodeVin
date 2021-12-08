var express = require('express');
var app = express();

var cors = require('cors');
app.use(cors());

// module to parse the API body request
var bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// register view engine
app.set('view engine', 'ejs');
app.set("views", "resources/views");

/* SWAGGER */

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Express API for GoToDeVin',
            version: '1.0.0',
            description:
                'This is a REST API application made with Express to navigate and order the wines of a winery',
            license: {
                name: 'Licensed Under MIT',
                url: 'https://spdx.org/licenses/MIT.html',
            },
            contact: {
                name: 'Group36',
                url: 'http://localhost:8080/',
            },
        },
        servers: [
            {
                url: 'http://localhost:8080/',
                description: 'Development server',
            },
        ],
    },
    apis: ["app.js"]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const db = require('better-sqlite3')('./resources/data/GoToDeDB.db');

/* ROUTES */

app.get('/', (req, res) => {
    res.render('index')
})


/* APIs*/

function verificaDisponibilita(quantita, nome) {
    db.all("SELECT disponibilita FROM Vini WHERE nome=\"" + nome + "\"", (err, rows) => {
        disponibilita = rows["disponibilita"];
    });
    return (disponibilita >= quantita);
} //SE NON DISP PER ORA MANDO UNA STRINGA MEGLIO MANDARE ANCHE/SOLO UN CODICE DI ERRORE?

//CATALOGO

/**
 * @swagger
 * /catalogo/vini:
 *   get:
 *     summary: lista dei vini disponibili.
 *     description: recupera dal database i vini che sono disponibili nel magazzino.
 *     responses:
 *       200:
 *         description: Lista dei nomi e delle annate dei vini.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   nome:
 *                     type: string
 *                     description: Il nome del vino.
 *                     example: sauvignon
 *                   annata:
 *                     type: integer
 *                     description: annata del vino.
 *                     example: 2015
 */
app.get('/catalogo/vini', function (req, res) {
    let sql = "SELECT nome, annata FROM Vini WHERE disponibilita > 0";
    res.send(db.prepare(sql).all());
});

/**
 * @swagger
 * /catalogo/ricerca/{nome vino}&{annata}:
 *   get:
 *     summary: lista dei vini disponibili ricercati.
 *     description: recupera dal database i vini che sono disponibili nel magazzino e che rispettano i criteri di ricerca, 
 *                  posso avere uno dei due criteri non specificati mettendo in nome la stringa NONE o 0 in annata.
 *     parameters:
 *       - in: path
 *         name: nome vino
 *         schema:
 *           type: string
 *           description: Il nome del vino.
 *           example: sauvignon
 *       - in: path
 *         name: annata
 *         schema:
 *           type: integer
 *           description: annata del vino.
 *           example: 2015
 *         required: true
 *         description: parametri di ricerca
 *     responses:
 *       200:
 *         description: Lista dei nomi dei vini corrispondenti ai criteri di ricerca.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   nome:
 *                     type: string
 *                     description: Il nome del vino.
 *                     example: sauvignon
 *                   annata:
 *                     type: integer
 *                     description: annata del vino.
 *                     example: 2015
 */
app.get('/catalogo/ricerca/:nome&:annata', function (req, res) { //VINO o VINI???
    let sql = "SELECT nome,annata FROM Vini WHERE disponibilita > 0"; //assumo che questa funzione non possa essere chiamata senza almeno un criterio di ricerca

    let nome = req.params.nome, annata = req.params.annata;
    if (nome != "NONE") {
        sql += " AND nome LIKE '%" + nome + "%'"; //NON DEVE ESSERE ESATTAMENTE QUELLO
    }
    if (annata != 0) sql += " AND annata = " + annata;
    res.send(db.prepare(sql).all());
});

/**
 * @swagger
 * /catalogo/dettaglio/{nome}:
 *   get:
 *     summary: dettaglio vino.
 *     description: recupera dal database i dettagli di un vino.
 *     parameters:
 *       - in: path
 *         name: nome
 *         schema:
 *           type: string
 *         required: true
 *         description: il nome del vino di cui voglio ottenere informazioni più dettagliate
 *     responses:
 *       200:
 *         description: dati inerenti al vino.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   nome:
 *                     type: string
 *                     description: Il nome del vino.
 *                     example: sauvignon
 *                   annata:
 *                     type: integer
 *                     description: annata del vino.
 *                     example: 2015
 *                   descrizione:
 *                     type: string
 *                     description: descrizione del vino.
 *                     example: vino eccelso con note fruttate eccellenti
 *                   disponibilita:
 *                     type: integer
 *                     description: quantità in magazzino.
 *                     example: 52
 *                   prezzo:
 *                     type: float
 *                     description: prezzo al litro del vino.
 *                     example: 15.3
 */
app.get('/catalogo/dettaglio/:name', function (req, res) {
    let sql = "SELECT * FROM Vini WHERE nome = '" + req.params.name + "'"; //VINI O VINO?
    res.send(db.prepare(sql).all());
});

//ASSISTENZA

app.get('/assistenza', function (req, res) {
    let sql = "SELECT * FROM Operatori";
    res.send(db.prepare(sql).all());
});

//ORDINI

app.get('/ordini/:email', function (req, res) {
    let sql = "SELECT id, tipo, stato, data_creazione, data_ritirabile FROM Ordini WHERE proprietario='" + req.params.email + "'";
    res.send(db.prepare(sql).all());
})

app.get('/ordini/dettaglio/:id', function (req, res) {
    let idOrdine = req.params.id;
    let sql = "SELECT * FROM Ordini_Vini WHERE ordine=" + idOrdine;
    let vini = db.prepare(sql).all();

    sql = "SELECT * FROM Ordini WHERE id=" + idOrdine + " LIMIT 1";
    let ordine = db.prepare(sql).all();

    ordine[0].items = vini;

    res.send(ordine);
})

//CARRELLO

app.get('/carrello/:email', function (req, res) {
    let sql = "SELECT * FROM Acquistabili WHERE cliente ='" + req.params.email + "'";
    res.send(db.prepare(sql).all());
});

app.post('/carrello/modifica', function (req, res) { //dovrei fare una seconda funzione dedicata per l'eliminazione?
    let sql, quantita = req.body['quantita'], nomeVino = req.body['nomeVino'], utente = req.body['email'], eseguiSql = true;

    if (quantita = 0) sql = "DELETE FROM Acquistabili WHERE vino=" + nomeVino + " AND cliente = '" + utente + "'";
    else {
        if (verificaDisponibilita(quantita, nomeVino)) sql = "UPDATE Acquistabili SET quantita=" + quantita + " WHERE vino='" + nomeVino + "' AND cliente = '" + utente + "'";
        else {
            res.send("disponibilità insufficiente");
            eseguiSql = false;
        }
    }

    if (eseguiSql) {
        db.prepare(sql);
    }
});

app.delete('/carrello/modifica', function (req, res) {
    let nomeVino = req.body['nomeVino'], utente = req.body['email'];
    let sql = "DELETE FROM Acquistabili WHERE vino='" + nomeVino + "' AND cliente = '" + utente + "'";
    db.prepare(sql);
});

app.post('/carrello/aggiungi', function (req, res) {
    let sql, quantita = req.body['quantita'], nomeVino = req.body['nomeVino'], utente = req.body['email'], eseguiSql = true;
    if (quantita == 0) req.send("aggiunti 0 vini al carrello")
    else {
        sql = "INSER INTO Acquistabili (vino, cliente, quantita) VALUES ('" + nomeVino + "', '" + utente + "', " + quantita;
        db.prepare(sql);
    }
});

app.post('/carrello/pre-ordina/', function (req, res) { // DA FINIRE
    let utente = req.body.email, tipo = req.body.tipo, aggiungiPreordine = true, viniMancanti = "I seguenti vini non sono disponibili:";
    let prodotti = db.prepare("SELECT * FROM Acquistabili WHERE cliente='" + utente + "'").all();
    prodotti.forEach((elem) => {
        if (!verificaDisponibilita(elem['quantita'], elem['nome_vino'])) {
            aggiungiPreordine = false;
            viniMancanti += " " + elem['nome_vino'];
        }
    });
    if (aggiungiPreordine) {
        db.prepare("INSERT INTO Ordini VALUES ('" + tipo + "', )")
        prodotti.forEach((elem) => {
            db.prepare("INSERT INTO ");
        });
    } else {
        res.send(viniMancanti)
    }
});

app.listen(8080, function () {
    console.log('GoTodeVin listening on port 8080!');
});