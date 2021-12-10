var express = require('express');
var app = express();

app.use('/resources', express.static(__dirname + '/resources'));

//var jquery = require('jquery');
//var datatables = require('datatables.net-bs5')();

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
});

app.get('/:name', (req, res) => {
    let sql = `SELECT * FROM Vini WHERE nome = '${req.params.name}'`;
    const data = db.prepare(sql).all()[0];
    res.render('wine', { data });
});

/* APIs*/

//todo: SAREBBE DA CATCHARE GLI ERRORI GENERATI DALLE QUERY
//todo: codici di ritorno personalizzati

function verificaDisponibilita(quantita, nome) {
    db.all(`SELECT disponibilita FROM Vini WHERE nome='${nome}'`, (err, rows) => {
        disponibilita = rows["disponibilita"];
    });
    return (disponibilita >= quantita);
} //SE NON DISP PER ORA MANDO UNA STRINGA MEGLIO MANDARE ANCHE/SOLO UN CODICE DI ERRORE?

//CATALOGO

/**
 * @swagger
 * /api/catalogo/vini:
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
 *                   prezzo:
 *                     type: float
 *                     description: prezzo del vino.
 *                     example: 15.3
 */
app.get('/api/catalogo/vini', function (req, res) {
    const sql = "SELECT nome, annata, prezzo FROM Vini WHERE disponibilita > 0";
    res.send(db.prepare(sql).all());
});

/**
 * @swagger
 * /api/catalogo/ricerca/{nome vino}&{annata}:
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
app.get('/api/catalogo/ricerca/:nome&:annata', function (req, res) { //VINO o VINI???
    const sql = "SELECT nome,annata FROM Vini WHERE disponibilita > 0"; //assumo che questa funzione non possa essere chiamata senza almeno un criterio di ricerca
});

/**
 * @swagger
 * /api/catalogo/dettaglio/{nome}:
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
 *                     example: Sauvignon
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
 *                     description: prezzo del vino.
 *                     example: 15.3
 */
app.get('/api/catalogo/dettaglio/:name', function (req, res) {
    const sql = `SELECT * FROM Vini WHERE nome = '${req.params.name}'`;
    res.send(db.prepare(sql).all());
});

//ASSISTENZA

/**
 * @swagger
 * /api/assistenza:
 *   get:
 *     summary: dettagli assistenza.
 *     description: recupera le informazioni necessarie a mostrare i numeri di assistenza.
 *     responses:
 *       200:
 *         description: dati per assistenza.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   contatto:
 *                     type: string
 *                     description: numero per whatsapp o link a telegram o email.
 *                     example: 1564684343
 *                   applicazione:
 *                     type: string
 *                     description: tipo applicazione da cui aprire il contatto.
 *                     example: Whatsapp
 */
app.get('/api/assistenza', function (req, res) {
    const sql = "SELECT * FROM Operatori";
    res.send(db.prepare(sql).all());
});

//ORDINI

/**
 * @swagger
 * /api/ordini/{email}:
 *   get:
 *     summary: ordini.
 *     description: recupera dal database gli ordini di un cliente. Fa inoltre il controllo della scadenza degli ordini e dei preordini
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: la mail dell'utente che sta richiedendo i propri ordini
 *     responses:
 *       200:
 *         description: elenco degli ordini.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: L'id dell'ordine o preordine.
 *                     example: 5
 *                   tipo:
 *                     type: string
 *                     description: O per gli ordini P per i preordini.
 *                     example: O
 *                   stato:
 *                     type: string
 *                     description: stato dell'ordine che identifica in che fase della sua vita si trova.
 *                     example: inLavorazione
 *                   data_creazione:
 *                     type: string
 *                     description: data creazione.
 *                     example: 2021-11-28T15:48:56.000
 *                   data_ritirabile:
 *                     type: string
 *                     description: data di quando l'ordine è stato inserito nel locker ed è in attesa di essere rimosso.
 *                     example: 2021-11-28T15:58:56.000
 */
app.get('/api/ordini/:email', function (req, res) {
    const sql = `SELECT id, tipo, stato, data_creazione, data_ritirabile FROM Ordini WHERE proprietario='${req.params.email}'`;
    const ordini = db.prepare(sql).all();

    ordini.forEach((elem) => {
        let dateParts = elem.data_creazione;
        let jsDate = new Date(dataParts + "Z"); // NON SO SE FUNZIONA
        let dataPresente = new Date();
        if (elem.tipo == 'P' && dataPresente - jsDate > 21600000) {
            db.prepare("DELETE FROM Ordini WHERE id=" + elem.id).run();

            let vini = db.prepare("SELECT FROM Ordini_Vini WHERE ordine=" + elem.id).all();
            vini.forEach((elem) => {
                db.prepare("UPDATE Vini SET disponibilita=disponibilita+" + elem.quantita + " WHERE nome='" + elem.vino + "'").run();
            });

            db.prepare("DELETE FROM Ordini_Vini WHERE ordine=" + elem.id).run();
        }

        dateParts = elem.data_ritirabile;
        jsDate = new Date(dataParts + "Z"); // NON SO SE FUNZIONA
        if (elem.tipo == 'O' && dataPresente - jsDate > 300000 && elem.stato == "daRitirare") {
            let vini = db.prepare("SELECT FROM Ordini_Vini WHERE ordine=" + elem.id).all();
            vini.forEach((elem) => {
                db.prepare("UPDATE Vini SET disponibilita=disponibilita+" + elem.quantita + " WHERE nome='" + elem.vino + "'").run();
            });
            db.prepare("UPDATE Ordini SET stato='scaduto' WHERE id=" + elem.id).run();
        }
    });

    res.send(db.prepare(sql).all());
});

/**
 * @swagger
 * /api/ordini/dettaglio/{idOrdine}:
 *   get:
 *     summary: dettaglio ordini.
 *     description: recupera dal database i dettagli di un ordine.
 *     parameters:
 *       - in: path
 *         name: idOrdine
 *         schema:
 *           type: string
 *         required: true
 *         description: l'id dell'ordine di cui voglio ottenere più informazioni
 *     responses:
 *       200:
 *         description: dettagli degli ordini.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: L'id dell'ordine o preordine.
 *                     example: 5
 *                   tipo:
 *                     type: string
 *                     description: O per gli ordini P per i preordini.
 *                     example: O
 *                   qr:
 *                     type: string
 *                     description: path all'immagine contenente il QR.
 *                     example: localhost:8080/resources/images/qr.png
 *                   locker:
 *                     type: integer
 *                     description: numero del locker in cui l'ordine è stato inserito.
 *                     example: O
 *                   stato:
 *                     type: string
 *                     description: stato dell'ordine che identifica in che fase della sua vita si trova.
 *                     example: inLavorazione
 *                   data_creazione:
 *                     type: string
 *                     description: data creazione.
 *                     example: 2021-11-28T15:48:56.000
 *                   data_ritirabile:
 *                     type: string
 *                     description: data di quando l'ordine è stato inserito nel locker ed è in attesa di essere ritirato.
 *                     example: 2021-11-28T15:58:56.000
 *                   data_ritirato:
 *                     type: string
 *                     description: data di quando l'ordine è stato ritirato.
 *                     example: 2021-11-28T16:00:56.000
 *                   vini:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         vino:
 *                           type: string
 *                           description: nome del vino.
 *                           example: Sauvignon
 *                         quantita:
 *                           type: integer
 *                           description: quantità in carrello.
 *                           example: 15
 */
app.get('/api/ordini/dettaglio/:id', function (req, res) {
    let sql = "SELECT vino,quantita FROM Ordini_Vini WHERE ordine=" + idOrdine;
    const idOrdine = req.params.id;
    const vini = db.prepare(sql).all();

    sql = "SELECT * FROM Ordini WHERE id=" + idOrdine + " LIMIT 1";
    let ordine = db.prepare(sql).all();

    ordine[0].vini = vini;
    res.send(ordine);
});

//CARRELLO

/**
 * @swagger
 * /api/carrello/{email}:
 *   get:
 *     summary: carrello.
 *     description: recupera dal database i vini presenti nel carrello di un cliente
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: la mail dell'utente che sta richiedendo il proprio carrello
 *     responses:
 *       200:
 *         description: elenco vini con relativa quantità.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   vino:
 *                     type: string
 *                     description: nome del vino.
 *                     example: Sauvignon
 *                   quantita:
 *                     type: integer
 *                     description: quantità in carrello.
 *                     example: 15
 */
app.get('/api/carrello/:email', function (req, res) {
    const sql = `SELECT vino,quantita FROM Acquistabili WHERE cliente ='${req.params.email}'`;
    res.send(db.prepare(sql).all());
});

/**
 * @swagger
 * /api/carrello/modifica:
 *   post:
 *     summary: modifica carrello.
 *     description: modifica la quantità per un elemento nel carrello, se non vi sono abbastanza vini disponibili allora non andrà avanti con la modifica
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantita:
 *                  type: integer
 *                  description: quantità dell'elemento da cambiare.
 *                  example: 10
 *               nomeVino:
 *                  type: string
 *                  description: il nome del vino a cui si riferisce la modifica.
 *                  example: Sauvignon
 *               email:
 *                  type: string
 *                  description: il cliente che ha richiesto la modifica
 *                  example: RobbieJLavender@dayrep.com
 *     responses:
 *       200:
 *         description: risultato operazione.
 *         content:
 *           text/plain:
 *             schema:
 *                type: string
 *                description: risultato operazione
 *                example: modifica avvenuta
 */
app.post('/api/carrello/modifica', function (req, res) {
    let sql, quantita = req.body['quantita'], nomeVino = req.body['nomeVino'], utente = req.body['email'], eseguiSql = true;

    if (quantita == 0) {
        sql = `DELETE FROM Acquistabili WHERE vino='${nomeVino}' AND cliente = '${utente}'`;
    }
    else if (verificaDisponibilita(quantita, nomeVino)) {
        sql = `UPDATE Acquistabili SET quantita='${quantita}' WHERE vino='${nomeVino}' AND cliente = '${utente}'`;
    }
    else {
        res.send("disponibilità insufficiente");
        eseguiSql = false;
    }

    if (eseguiSql) {
        db.prepare(sql).run();
        res.send("modifica avvenuta");
    }
});

/**
 * @swagger
 * /api/carrello/modifica:
 *   delete:
 *     summary: rimuovi da carrello.
 *     description: rimuove un elemento nel carrello
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nomeVino:
 *                  type: string
 *                  description: il nome del vino a cui si riferisce la modifica.
 *                  example: Sauvignon
 *               email:
 *                  type: string
 *                  description: il cliente che ha richiesto la modifica
 *                  example: RobbieJLavender@dayrep.com
 *     responses:
 *       200:
 *         description: risultato operazione.
 *         content:
 *           text/plain:
 *             schema:
 *                type: string
 *                description: risultato operazione
 *                example: eliminato
 */
app.delete('/api/carrello/modifica', function (req, res) { //DOVRE METTERE UNA RISPOSTA PARTICOLARE SE IL VINO NON C'ERA NEL CARRELLO?
    // Ti insegno una piccola furbata per non dover fare sempre tutte queste variabili all'inizio dove destrutturi il json
    const { body: { nomeVino, email } } = req
    const sql = `DELETE FROM Acquistabili WHERE vino='${nomeVino}' AND cliente = '${email}'`;

    db.prepare(sql).run();
    res.send("eliminato");
});

/**
 * @swagger
 * /api/carrello/aggiungi:
 *   post:
 *     summary: modifica carrello.
 *     description: modifica la quantità per un elemento nel carrello, se non vi sono abbastanza vini disponibili allora non andrà avanti con l'aggiunta idem se l'elemento è già in carrello
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nomeVino:
 *                  type: string
 *                  description: il nome del vino da aggiungere.
 *                  example: Sauvignon
 *               email:
 *                  type: string
 *                  description: il cliente che ha richiesto l'aggiunta
 *                  example: RobbieJLavender@dayrep.com
 *     responses:
 *       200:
 *         description: risultato operazione.
 *         content:
 *           text/plain:
 *             schema:
 *                type: string
 *                description: risultato operazione
 *                example: aggiunto
 */
app.post('/api/carrello/aggiungi', function (req, res) { // QUANDO L'ELEMENTO E' GIA' IN CARRRELLO DOVREI AGGIUNGERE LA QUANTITA' RICEVUTA O SCARTARE LA MODIFICA?
    const { body: { quantita, nomeVino, email } } = res;
    if (quantita == 0 || !verificaDisponibilita(quantita, nomeVino)) {
        req.send("aggiunti 0 vini al carrello");
    }
    else {
        let esiste = db.prepare(`SELECT * FROM Acquistabili WHERE vino='${nomeVino}' AND cliente='${email}'`).all();
        if (esiste.length != 0) res.send("vino già presente");
        else {
            sql = "INSERT INTO Acquistabili (vino, cliente, quantita) VALUES ('" + nomeVino + "', '" + email + "', " + quantita + ")";
            db.prepare(sql).run();
            res.send("aggiunto");
        }
    }
});

/**
 * @swagger
 * /api/carrello/pre-ordina:
 *   post:
 *     summary: ordina o preordina.
 *     description: ordina o preordina il contenuto del carrello, che viene svuotato.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo:
 *                  type: string
 *                  description: carattere per identificare se si sta creando un ordine o un preordine
 *                  example: O
 *               email:
 *                  type: string
 *                  description: il cliente che ha richiesto l'ordinazione
 *                  example: RobbieJLavender@dayrep.com
 *     responses:
 *       200:
 *         description: risultato operazione.
 *         content:
 *           text/plain:
 *             schema:
 *                type: string
 *                description: risultato operazione
 *                example: ordine creato
 */
app.post('/api/carrello/pre-ordina', function (req, res) { // DA FINIRE
    const { body: { utente, tipo } } = req;
    const aggiungiPreordine = true, viniMancanti = "I seguenti vini non sono disponibili:";

    let prodotti = db.prepare(`SELECT * FROM Acquistabili WHERE cliente='${utente}'`).all();
    prodotti.forEach((elem) => {
        if (!verificaDisponibilita(elem['quantita'], elem['nome_vino'])) {
            aggiungiPreordine = false;
            viniMancanti += " " + elem['nome_vino'];
        }
    });

    if (aggiungiPreordine) {
        db.prepare(`DELETE FROM Acquistabili WHERE cliente='${utente}'`).run();
        stato = (tipo == 'O') ? "inLavorazione" : "attesaPagamento";

        let id = db.prepare("INSERT INTO Ordini (tipo,stato,data_creazione,cliente) VALUES ('" + tipo + "', '" + stato + "', " + new Date().toISOString().replace('Z', '') + ", cliente='" + utente + "')").run();
        id = id.lastInsertRowid;
        //NON SO SE FUNZIONA L'INSERIMENTO DELLA DATA

        prodotti.forEach((elem) => {
            db.prepare(`INSERT INTO Ordini_Vini (vino, ordine, quantita) VALUES ('${elem.nome}',${id},${elem.quantita})`).run();
            db.prepare(`UPDATE Vini SET disponibilita=disponibilita-${elem.quantita} WHERE nome='${elem.nome}'`).run();
        });
        res.send("ordine creato")
    } else {
        res.send(viniMancanti)
    }
});

//WALLET

/**
 * @swagger
 * /api/wallet/saldo/{email}:
 *   get:
 *     summary: saldo.
 *     description: recupera dal database il saldo contenuto nel wallet di un cliente
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: la mail dell'utente che sta richiedendo il proprio saldo
 *     responses:
 *       200:
 *         description: saldo wallet.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   saldo:
 *                     type: float
 *                     description: saldo.
 *                     example: 15.8
 */
app.get('/api/wallet/saldo/:email', function (req, res) {
    res.send(db.prepare(`SELECT saldo FROM Clienti WHERE email='${req.params.email}'`).all());
});

/**
 * @swagger
 * /api/wallet/ricarica:
 *   post:
 *     summary: ordina o preordina.
 *     description: ordina o preordina il contenuto del carrello, che viene svuotato.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ricarica:
 *                  type: float
 *                  description: valore della ricarica
 *                  example: 15.3
 *               email:
 *                  type: string
 *                  description: il cliente che ha richiesto l'ordinazione
 *                  example: RobbieJLavender@dayrep.com
 *     responses:
 *       200:
 *         description: risultato operazione.
 *         content:
 *           text/plain:
 *             schema:
 *                type: string
 *                description: risultato operazione
 *                example: ricarica effettuata
 */
app.post('/api/wallet/ricarica', function (req, res) {
    db.prepare(`UPDATE Clienti SET saldo=saldo+${req.body.ricarica} WHERE cliente='${req.body.email}'`).run();
    res.send("ricarica effettuata");
});

//PREORDINE
// TODO: prendi in input il metodo di pagamento e se wallet, scala saldo

/**
 * @swagger
 * /api/preordine/converti:
 *   post:
 *     summary: ordina o preordina.
 *     description: ordina o preordina il contenuto del carrello, che viene svuotato.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                  type: integer
 *                  description: id del preordine da modificare
 *                  example: 156
 *     responses:
 *       200:
 *         description: risultato operazione.
 *         content:
 *           text/plain:
 *             schema:
 *                type: string
 *                description: risultato operazione
 *                example: ordine creato
 */
app.post('/api/preordine/converti', function (req, res) {
    //todo: VERIFICA CHE NON SIA SCADUTO
    db.prepare(`UPDATE Ordini SET tipo='O', stato='inLavorazione' WHERE id=${req.body.id}`).run();
    res.send("ordine creato")
});

//PRODUTTORE

/**
 * @swagger
 * /api/ordini/dettaglio_tutti:
 *   get:
 *     summary: report ordini.
 *     description: invia tutti i dettagli su tutti gli ordini avvenuti sul sito.
 *     responses:
 *       200:
 *         description: dettagli degli ordini.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: L'id dell'ordine o preordine.
 *                     example: 5
 *                   tipo:
 *                     type: string
 *                     description: O per gli ordini P per i preordini.
 *                     example: O
 *                   qr:
 *                     type: string
 *                     description: path all'immagine contenente il QR.
 *                     example: localhost:8080/resources/images/qr.png
 *                   locker:
 *                     type: integer
 *                     description: numero del locker in cui l'ordine è stato inserito.
 *                     example: O
 *                   stato:
 *                     type: string
 *                     description: stato dell'ordine che identifica in che fase della sua vita si trova.
 *                     example: inLavorazione
 *                   data_creazione:
 *                     type: string
 *                     description: data creazione.
 *                     example: 2021-11-28T15:48:56.000
 *                   data_ritirabile:
 *                     type: string
 *                     description: data di quando l'ordine è stato inserito nel locker ed è in attesa di essere ritirato.
 *                     example: 2021-11-28T15:58:56.000
 *                   data_ritirato:
 *                     type: string
 *                     description: data di quando l'ordine è stato ritirato.
 *                     example: 2021-11-28T16:00:56.000
 *                   vini:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         vino:
 *                           type: string
 *                           description: nome del vino.
 *                           example: Sauvignon
 *                         quantita:
 *                           type: integer
 *                           description: quantità in carrello.
 *                           example: 15
 */
app.get('/api/ordini/dettaglio_tutti', function (req, res) {
    let sql = "SELECT * FROM Ordini";
    let ordine = db.prepare(sql).all();
    let vini = null;

    ordine.forEach((elem, ind) => {
        sql = "SELECT vino,quantita FROM Ordini_Vini WHERE ordine=" + elem.id;
        vini = db.prepare(sql).all();
        ordine[ind].vini = vini;
    });

    res.send(ordine);
});

//GESTIONALE

/**
 * @swagger
 * /api/gestionale/giacenza:
 *   post:
 *     summary: giacenza.
 *     description: modifica la disponibilità di un vino.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantita:
 *                  type: integer
 *                  description: nuova disponibilità del vino
 *                  example: 156
 *               nomeVino:
 *                  type: string
 *                  description: nome del vino a cui modificare la disponibilità
 *                  example: Sauvignon
 *     responses:
 *       200:
 *         description: operazione avvenuta.
 *         content:
 *           text/plain:
 *             schema:
 *                type: string
 *                description: risultato operazione
 *                example: Vino specificato modificato
 *       400:
 *         description: dati errati.
 *         content:
 *           text/plain:
 *             schema:
 *                type: string
 *                description: risultato operazione
 *                example: la quantità specificata non è valida
 */
app.post('/api/gestionale/giacenza', function (req, res) {
    const { body: { nomeVino, quantita } } = req;
    if (quantita >= -1) { //-1 sta per prodotto non più rifornito
        db.prepare(`UPDATE Vini SET disponibilita = ${quantita} WHERE nome='${nomeVino}'`).run();
        res.send("vino specificato modificato")
    } else {
        res.status(400);
        res.send("la quantità specificata non è valida");
    }
});

app.post('/api/gestionale/creaVino', function (req, res) {
    const { body: { nomeVino, annata, descrizione, disponibilita, prezzo } } = req

    if (nomeVino != "" && descrizione != "" && disponibilita > 0 && prezzo > 0.0) {
        db.prepare("INSERT")
    } else {
        res.status(400);
        res.send("richiesta malformata");
    }
});

app.listen(8080, function () {
    console.log('GoTodeVin listening on port 8080!');
});