var express = require('express');
var app = express();

app.use('/resources', express.static(__dirname + '/resources'));

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
                name: 'Group 36',
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
app.use('/api/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const db = require('better-sqlite3')('./resources/data/GoToDeDB.db');

/* ROUTES */

// DA FARE:

// DUBBIO:

// COMPLETATI DA VERIFICARE:
//todo: carrello saldo non disponibilie FATTO?
//todo: i bottoni di test nell'ordine sono cliccabili quando l'ordine è scaduto FATTO?
//todo: se un cliente ordina tutti i vini disponibili ma un altro cliente aveva quel vino nel carrello giustamente quando prova ad acquistare non avviene l'acquisto ma non è nemmeno mostrato
//      il messaggio che invio in cui specifico i vini non disponibili FATTO?
//todo: quando modifico la quantità in carrello se non avviene secondo me andrebbe mostrato un errore di qualche tipo o sembra che semplicemente non abbia preso l'input FATTO?
//todo: ordine scaduto non dovrebbe avere il qr FATTO?
//todo: bottone test link a report ordini visibile solo a Admin FATTO?
//todo: setta disponibilità FATTO?
//todo: aggiungi vino al catalogo
//todo: IL PREORDINA NON DOVREBBE CHIEDERE IL METODO DI PAGAMENTO
//todo: il totale nel carrello è ancora sporco con cifre dopo la seconda
//todo: controllo che annata inserita sia minore della data attuale




app.get('/', (req, res) => {
    res.render('index')
});

app.get('/carrello', (req, res) => {
    res.render('carrello')
});

app.get('/ordini', (req, res) => {
    res.render('ordini');
});

app.get('/ordini/:id', (req, res) => {
    res.render('ordine')
});

app.get('/assistenza', (req, res) => {
    res.render('assistenza');
});

app.get('/ricarica', (req, res) => {
    res.render('ricarica');
});

app.get('/:name', (req, res) => {
    res.render('wine');
});

/* APIs */

function verificaDisponibilita(quantita, nome) {
    let disp = db.prepare(`SELECT disponibilita FROM Vini WHERE nome=?`).all(nome)[0];
    return (disp && disp.disponibilita >= quantita);
}

function calcolaPrezzo(quantita, vino) {
    let wine = db.prepare(`SELECT prezzo FROM Vini WHERE nome=?`).all(vino)[0];
    return (wine.prezzo * quantita);
}

//CATALOGO

/**
 * @swagger
 * /api/catalogo/vini:
 *   get:
 *     tags:
 *       - catalogo
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
 *     tags:
 *       - catalogo
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
app.get('/api/catalogo/ricerca/:nome&:annata', function (req, res) {
    let sql = "SELECT nome,annata FROM Vini WHERE disponibilita > 0";
    let nome = req.params.nome, annata = req.params.annata;
    if (nome != "NONE") {
        sql += " AND nome LIKE '%" + nome + "%'"; //NON DEVE ESSERE ESATTAMENTE QUELLO
    }
    if (annata != 0) sql += " AND annata = " + annata;
    res.send(db.prepare(sql).all());
});

/**
 * @swagger
 * /api/catalogo/dettaglio/{nome}:
 *   get:
 *     tags:
 *       - catalogo
 *     summary: dettaglio vino.
 *     description: recupera dal database i dettagli di un vino.
 *     parameters:
 *       - in: path
 *         name: nome
 *         schema:
 *           type: string
 *         required: true
 *         example: Sauvignon
 *         description: il nome del vino di cui voglio ottenere informazioni più dettagliate
 *     responses:
 *       200:
 *         description: dati inerenti al vino.
 *         content:
 *           application/json:
 *             schema:
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
 *       404:
 *         description: vino non trovato.
 *         text/plain:
 *           schema:
 *              type: string
 *              description: risultato operazione
 *              example: vino non trovato
 */
app.get('/api/catalogo/dettaglio/:name', function (req, res) {
    const sql = `SELECT * FROM Vini WHERE nome = '${req.params.name}'`;
    const wine = db.prepare(sql).all()[0];
    if (wine) {
        res.send(wine);
    } else {
        res.status(404);
        res.send("vino non trovato")
    }
});

//ASSISTENZA

/**
 * @swagger
 * /api/assistenza:
 *   get:
 *     tags:
 *       - assistenza
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
 *     tags:
 *       - ordini
 *     summary: ordini.
 *     description: recupera dal database gli ordini di un cliente. Fa inoltre il controllo della scadenza degli ordini e dei preordini
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         example: Pluto@GoToDeMail.com
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
 *                   totale:
 *                     type: float
 *                     description: costo totale ordine.
 *                     example: 150.7
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
 *       404:
 *         description: utente non trovato.
 *         content:
 *           text/plain:
 *             schema:
 *                type: string
 *                description: risultato operazione
 *                example: utente non registrato
 */
app.get('/api/ordini/:email', function (req, res) {
    const email = req.params.email;
    const sql = `SELECT id, tipo, stato, totale, data_creazione, data_ritirabile FROM Ordini WHERE cliente='${email}'`;
    let ordini = db.prepare(sql).all();
    const dataPresente = new Date();
    let dateParts, d;
    const cliente = db.prepare("SELECT * FROM Clienti WHERE email=?").all(email)[0];

    if (cliente) {
        ordini.forEach((elem) => {
            dateParts = elem.data_creazione.replace(' ', 'T') + 'Z';
            d = new Date(dateParts);

            if (elem.tipo == 'P' && Math.abs(dataPresente - d) > 21600000) {
                db.prepare("DELETE FROM Ordini WHERE id=?").run(elem.id);

                let vini = db.prepare("SELECT * FROM Ordini_Vini WHERE ordine=?").all(elem.id);
                vini.forEach((elem) => {
                    db.prepare("UPDATE Vini SET disponibilita=disponibilita+? WHERE nome=?").run(elem.quantita, elem.vino);
                });

                db.prepare("DELETE FROM Ordini_Vini WHERE ordine=?").run(elem.id);
            }

            if (elem.data_ritirabile != null) {
                dateParts = elem.data_ritirabile.replace(' ', 'T') + 'Z';
                d = new Date(dateParts);
                if (elem.tipo == 'O' && dataPresente - d > 300000 && elem.stato == "daRitirare") {
                    db.prepare("UPDATE Clienti SET saldo=saldo+? WHERE email=?").run(elem.totale, email)
                    let vini = db.prepare("SELECT * FROM Ordini_Vini WHERE ordine=?").all(elem.id);
                    vini.forEach((elem) => {
                        db.prepare("UPDATE Vini SET disponibilita=disponibilita+? WHERE nome=?").run(elem.quantita, elem.vino);
                    });
                    db.prepare("UPDATE Ordini SET stato='scaduto' WHERE id=?").run(elem.id);
                }
            }
        });

        ordini = db.prepare(sql).all();
        res.send(ordini);
    } else {
        res.status(404);
        res.send("utente non registrato");
    }
});

/**
 * @swagger
 * /api/ordini/dettaglio/{idOrdine}:
 *   get:
 *     tags:
 *       - ordini
 *     summary: dettaglio ordini.
 *     description: recupera dal database i dettagli di un ordine.
 *     parameters:
 *       - in: path
 *         name: idOrdine
 *         schema:
 *           type: string
 *         required: true
 *         example: 1
 *         description: l'id dell'ordine di cui voglio ottenere più informazioni
 *     responses:
 *       200:
 *         description: dettagli degli ordini.
 *         content:
 *           application/json:
 *             schema:
 *                 type: object
 *                 properties:
 *                       id:
 *                         type: integer
 *                         description: L'id dell'ordine o preordine.
 *                         example: 1
 *                       tipo:
 *                         type: string
 *                         description: O per gli ordini P per i preordini.
 *                         example: O
 *                       qr:
 *                         type: string
 *                         description: path all'immagine contenente il QR.
 *                         example: localhost:8080/resources/images/qr.png
 *                       locker:
 *                         type: integer
 *                         description: numero del locker in cui l'ordine è stato inserito.
 *                         example: O
 *                       stato:
 *                         type: string
 *                         description: stato dell'ordine che identifica in che fase della sua vita si trova.
 *                         example: inLavorazione
 *                       totale:
 *                         type: float
 *                         description: prezzo totale ordine.
 *                         example: 375.6
 *                       data_creazione:
 *                         type: string
 *                         description: data creazione.
 *                         example: 2021-11-28T15:48:56.000
 *                       data_ritirabile:
 *                         type: string
 *                         description: data di quando l'ordine è stato inserito nel locker ed è in attesa di essere ritirato.
 *                         example: 2021-11-28T15:58:56.000
 *                       data_ritirato:
 *                         type: string
 *                         description: data di quando l'ordine è stato ritirato.
 *                         example: 2021-11-28T16:00:56.000
 *                       vini:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             vino:
 *                               type: string
 *                               description: nome del vino.
 *                               example: Sauvignon
 *                             quantita:
 *                               type: integer
 *                               description: quantità in carrello.
 *                               example: 15
 *                             subtotale:
 *                               type: float
 *                               description: prezzo di quella quantità di quel vino.
 *                               example: 150.3
 *       404:
 *         description: ordine non trovato.
 *         content:
 *           text/plain:
 *             schema:
 *                type: string
 *                description: risultato operazione
 *                example: ordine inesistente
 */
app.get('/api/ordini/dettaglio/:id', function (req, res) {
    const idOrdine = req.params.id;
    let sql = "SELECT vino,quantita FROM Ordini_Vini WHERE ordine=" + idOrdine;
    const vini = db.prepare(sql).all();
    vini.forEach((elem) => {
        elem.subtotale = calcolaPrezzo(elem.quantita, elem.vino)
    });

    sql = "SELECT * FROM Ordini WHERE id=" + idOrdine + " LIMIT 1";
    let ordine = db.prepare(sql).all()[0];

    if (ordine) {
        ordine.vini = vini;
        res.send(ordine);
    } else {
        res.status(404);
        res.send("ordine inesistente")
    }
});

//CARRELLO

/**
 * @swagger
 * /api/carrello/{email}:
 *   get:
 *     tags:
 *       - carrello
 *     summary: carrello.
 *     description: recupera dal database i vini presenti nel carrello di un cliente
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         example: Pluto@GoToDeMail.com
 *         description: la mail dell'utente che sta richiedendo il proprio carrello
 *     responses:
 *       200:
 *         description: elenco vini con relativa quantità.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totale:
 *                   type: float
 *                   description: totale carrello
 *                   example: 250.5
 *                 elementi:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       vino:
 *                         type: string
 *                         description: nome del vino.
 *                         example: Sauvignon
 *                       quantita:
 *                         type: integer
 *                         description: quantità in carrello.
 *                         example: 15
 *                       prezzo:
 *                         type: float
 *                         description: subtotale carrello.
 *                         example: 125.7
 *       404:
 *         description: utente non trovato.
 *         content:
 *           text/plain:
 *             schema:
 *                type: string
 *                description: risultato operazione
 *                example: utente non registrato
 */
app.get('/api/carrello/:email', function (req, res) {
    const cliente = db.prepare("SELECT * FROM Clienti WHERE email=?").all(req.params.email)[0];
    let total = 0, carrello, subtotale;
    if (cliente) {
        const sql = `SELECT vino, quantita FROM Acquistabili
                    WHERE cliente ='${req.params.email}'`;
        carrello = db.prepare(sql).all();
        carrello.forEach((elem) => {
            subtotale = calcolaPrezzo(elem.quantita, elem.vino);
            elem.prezzo = subtotale;
            total += subtotale;
        });

        res.send({ totale: total, elementi: carrello });
    } else {
        res.status(404);
        res.send("utente non registrato");
    }
});

/**
 * @swagger
 * /api/carrello/modifica:
 *   post:
 *     tags:
 *       - carrello
 *     summary: modifica carrello.
 *     description: modifica la quantità per un elemento nel carrello, se non vi sono abbastanza vini disponibili allora non andrà avanti con la modifica
 *     requestBody:
 *       description: nuova quantità del vino, nome del vino da modificare e a chi fare la modifica
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
 *               nome:
 *                  type: string
 *                  description: il nome del vino a cui si riferisce la modifica.
 *                  example: Sauvignon
 *               email:
 *                  type: string
 *                  description: il cliente che ha richiesto la modifica
 *                  example: Pluto@GoToDeMail.com
 *     responses:
 *       200:
 *         description: risultato operazione.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 risultato:
 *                   type: boolean
 *                   description: risultato operazione
 *                   example: true
 *                 messaggio:
 *                   type: string
 *                   description: risultato operazione
 *                   example: modifica avvenuta
 *       400:
 *         description: risultato operazione.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 risultato:
 *                   type: boolean
 *                   description: risultato operazione
 *                   example: false
 *                 messaggio:
 *                   type: string
 *                   description: risultato operazione
 *                   example: richiesta malformata
 */
app.post('/api/carrello/modifica', function (req, res) {
    const { body: { quantita, nome, email } } = req;
    let eseguiSql = true;
    let sql, vino = db.prepare("SELECT * FROM Vini WHERE nome=?").all(nome)[0], modifiche;
    if (vino && quantita >= 0) {
        if (quantita == 0) {
            sql = `DELETE FROM Acquistabili WHERE vino='${nome}' AND cliente = '${email}'`;
        }
        else if (verificaDisponibilita(quantita, nome)) {
            sql = `UPDATE Acquistabili SET quantita='${quantita}' WHERE vino='${nome}' AND cliente = '${email}'`;
        }
        else {
            res.send({ risultato: false, messaggio: "disponibilità insufficiente" });
            eseguiSql = false;
        }
        if (eseguiSql) {
            modifiche = db.prepare(sql).run();
            if (modifiche.changes != 0) res.send({ risultato: true, messaggio: "modifica avvenuta" });
            else {
                //o era sbagliato l'utente o io non avevo l'acquistabile nel mio carrello
                res.status(400);
                res.send({ risultato: false, messaggio: "richiesta malformata" });
            }
        }
    } else {
        res.status(400);
        res.send({ risultato: false, messaggio: "richiesta malformata" })
    }
});

/**
 * @swagger
 * /api/carrello/modifica:
 *   delete:
 *     tags:
 *       - carrello
 *     summary: rimuovi da carrello.
 *     description: rimuove un elemento nel carrello
 *     requestBody:
 *       description: vino da rimuovere e cliente a cui rimuoverlo
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                  type: string
 *                  description: il nome del vino a cui si riferisce la modifica.
 *                  example: Sauvignon
 *               email:
 *                  type: string
 *                  description: il cliente che ha richiesto la modifica
 *                  example: Pluto@GoToDeMail.com
 *     responses:
 *       200:
 *         description: eliminazione avvenuta.
 *         content:
 *           text/plain:
 *             schema:
 *                type: string
 *                description: risultato operazione
 *                example: eliminato
 *       400:
 *         description: errore dati in input.
 *         content:
 *           text/plain:
 *             schema:
 *                type: string
 *                description: risultato operazione
 *                example: vino non presente nel carrello
 */

app.delete('/api/carrello/modifica', function (req, res) {
    const { body: { nome, email } } = req;
    const sql = `DELETE FROM Acquistabili WHERE vino='${nome}' AND cliente = '${email}'`;
    const modifiche = db.prepare(sql).run();
    if (modifiche.changes > 0) {
        res.send("eliminato");
    } else {
        res.status(400);
        res.send("vino non presente nel carrello")
    }
});

/**
 * @swagger
 * /api/carrello/aggiungi:
 *   post:
 *     tags:
 *       - carrello
 *     summary: modifica carrello.
 *     description: aggiunge un elemento nel carrello, se non vi sono abbastanza vini disponibili allora non andrà avanti con l'aggiunta idem se l'elemento è già in carrello
 *     requestBody:
 *       description: numero vini da aggiungere, nome del vino da aggiungere e cliente a cui aggiungere il vino al carrello
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantita:
 *                  type: integer
 *                  description: quanti vini voglio aggiungere al carrello
 *                  example: 8
 *               nome:
 *                  type: string
 *                  description: il nome del vino da aggiungere.
 *                  example: Sauvignon
 *               email:
 *                  type: string
 *                  description: il cliente che ha richiesto l'aggiunta
 *                  example: Pluto@GoToDeMail.com
 *     responses:
 *       200:
 *         description: risultato operazione.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 aggiunto:
 *                   type: boolean
 *                   description: aggiunto o no
 *                   example: true
 *                 messaggio:
 *                   type: string
 *                   description: risultato operazione
 *                   example: Vino aggiunto al carrello!
 *       400:
 *         description: richiesta malformata.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 aggiunto:
 *                   type: boolean
 *                   description: risultato
 *                   example: false
 *                 messaggio:
 *                   type: string
 *                   description: risultato operazione
 *                   example: richiesta malformata
 */
app.post('/api/carrello/aggiungi', function (req, res) {
    let { body: { quantita, nome, email } } = req;

    let vino = db.prepare("SELECT * FROM Vini WHERE nome=?").all(nome)[0], utente = db.prepare("SELECT * FROM Clienti WHERE email=?").all(email)[0];

    if (vino && quantita > 0 && utente) {
        vino = db.prepare(`SELECT * FROM Acquistabili WHERE vino='${nome}' AND cliente='${email}'`).all()
        if (vino.length != 0 && verificaDisponibilita(vino[0].quantita + quantita, nome)) {
            sql = `UPDATE Acquistabili SET quantita = ${quantita + vino[0].quantita} WHERE vino = '${nome}' AND cliente = '${email}'`
            db.prepare(sql).run();
            res.send({ aggiunto: true, messaggio: "Vino aggiunto al carrello!" });
        }
        else if (vino.length != 0 && !verificaDisponibilita(vino[0].quantita + quantita, nome)) {
            res.send({ aggiunto: false, messaggio: "Disponibilità insufficiente!" })
        }
        else if (verificaDisponibilita(quantita, nome)) {
            sql = "INSERT INTO Acquistabili (vino, cliente, quantita) VALUES (?,?,?)";
            db.prepare(sql).run(nome, email, quantita);
            res.send({ aggiunto: true, messaggio: "Vino aggiunto al carrello!" });
        }
        else {
            res.send({ aggiunto: false, messaggio: "Disponibilità insufficiente!" });
        }
    } else {
        res.status(400);
        res.send({ aggiunto: false, messaggio: "richiesta malformata" });
    }
});

/**
 * @swagger
 * /api/carrello/pre-ordina:
 *   post:
 *     tags:
 *       - carrello
 *     summary: ordina o preordina.
 *     description: ordina o preordina il contenuto del carrello, che viene svuotato.
 *     requestBody:
 *       descrizione: dati inserimento se ordina (tipo = O), preordina (tipo = P) se preordina non va specificato il metodo di pagamento
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
 *                  example: Pluto@GoToDeMail.com
 *               metodoPagamento:
 *                  type: string
 *                  description: id del preordine da modificare
 *                  example: wallet
 *     responses:
 *       200:
 *         description: risultato operazione.
 *         content:
 *           text/plain:
 *             schema:
 *                type: string
 *                description: risultato operazione
 *                example: ordine creato
 *       400:
 *         description: input malformato.
 *         content:
 *           text/plain:
 *             schema:
 *                type: string
 *                description: risultato operazione
 *                example: I seguenti vini non sono disponibili ...
 *       402:
 *         description: saldo insufficiente.
 *         content:
 *           text/plain:
 *             schema:
 *                type: string
 *                description: risultato operazione
 *                example: saldo insufficente
 */
app.post('/api/carrello/pre-ordina', function (req, res) {
    const { body: { email, tipo, metodoPagamento } } = req;
    let aggiungiPreordine = true, viniMancanti = "I seguenti vini non sono disponibili:", totale = 0, saldoSuff = true;

    let id, stato, data, prodotti = db.prepare(`SELECT * FROM Acquistabili WHERE cliente='${email}'`).all();
    prodotti.forEach((elem) => {
        let vino = db.prepare(`SELECT disponibilita, prezzo FROM Vini WHERE nome=?`).all(elem.vino)[0]
        if (!verificaDisponibilita(elem.quantita, elem.vino)) {
            aggiungiPreordine = false;
            viniMancanti += " " + elem.vino;
        }
        totale += calcolaPrezzo(elem.quantita, elem.vino);
    });

    if (prodotti.length == 0) {
        aggiungiPreordine = false;
        viniMancanti = "carrello vuoto";
    }

    if (aggiungiPreordine) {
        if (metodoPagamento == 'wallet' && tipo == 'O') {
            saldo = db.prepare('SELECT saldo FROM Clienti WHERE email=?').all(email)[0].saldo;
            if (saldo >= totale) {
                db.prepare("UPDATE Clienti SET saldo = saldo - ? WHERE email=?").run(totale, email);
            } else {
                saldoSuff = false;
            }
        }

        if (saldoSuff) {
            stato = (tipo == 'O') ? "inLavorazione" : "attesaPagamento";

            data = new Date().toISOString().replace('Z', '').replace('T', ' ');
            id = db.prepare("INSERT INTO Ordini (tipo,stato,data_creazione,cliente,totale,metodoPagamento) VALUES (?, ?, ?, ?, ?, ?)").run(tipo, stato, data, email, totale, metodoPagamento);
            id = id.lastInsertRowid;

            prodotti.forEach((elem) => {
                db.prepare(`INSERT INTO Ordini_Vini (vino, ordine, quantita) VALUES (?,?,?)`).run(elem.vino, id, elem.quantita);
                db.prepare(`UPDATE Vini SET disponibilita=disponibilita-? WHERE nome=?`).run(elem.quantita, elem.vino);
            });
            db.prepare(`DELETE FROM Acquistabili WHERE cliente='${email}'`).run();
            res.send("ordine creato");
        } else {
            res.status(402);
            res.send("saldo insufficiente");
        }
    } else {
        res.status(400);
        res.send(viniMancanti);
    }
});

//UTENTI

/**
 * @swagger
 * /api/utenti:
 *   get:
 *     tags:
 *       - utenti
 *     summary: utenti.
 *     description: recupera dal database tutti gli utenti esistenti.
 *     responses:
 *       200:
 *         description: Lista dei nomi e email degli utenti.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Il nome dell'utente.
 *                     example: Pluto
 *                   email:
 *                     type: string
 *                     description: email dell'utente.
 *                     example: Pluto@GoToDeMail.com
 *                   saldo:
 *                     type: float
 *                     description: saldo dell'utente.
 *                     example: 420.69
 * 
 */
app.get('/api/utenti/', function (req, res) {
    res.send(db.prepare(`SELECT email, name FROM Clienti`).all());
})

/**
 * @swagger
 * /api/utenti/{email}:
 *   get:
 *     tags:
 *       - utenti
 *     summary: recupera utente.
 *     description: recupera dal database il nome e email di un utente specificato.
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         example: Pluto@GoToDeMail.com
 *         description: la mail dell'utente che sta richiedendo il proprio saldo
 *     responses:
 *       200:
 *         description: Nome e email dell'utente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   description: Il nome dell'utente.
 *                   example: Pluto
 *                 email:
 *                   type: string
 *                   description: email dell'utente.
 *                   example: Pluto@GoToDeMail.com
 *       404:
 *         description: utente non trovato.
 *         content:
 *           text/plain:
 *             schema:
 *                type: string
 *                description: risultato operazione
 *                example: utente non registrato
 */
app.get('/api/utenti/:email', function (req, res) {
    const utente = db.prepare(`SELECT email, name, saldo FROM Clienti WHERE email='${req.params.email}'`).all()[0];
    if (utente) {
        res.send(utente);
    } else {
        res.status(404);
        res.send("utente non registrato")
    }
})

//WALLET

/**
 * @swagger
 * /api/wallet/saldo/{email}:
 *   get:
 *     tags:
 *       - utenti
 *     summary: saldo.
 *     description: recupera dal database il saldo contenuto nel wallet di un cliente
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         example: Pluto@GoToDeMail.com
 *         description: la mail dell'utente che sta richiedendo il proprio saldo
 *     responses:
 *       200:
 *         description: saldo wallet.
 *         content:
 *           application/json:
 *             schema:
 *                 type: object
 *                 properties:
 *                   saldo:
 *                     type: float
 *                     description: saldo.
 *                     example: 15.8
 *       404:
 *         description: utente non trovato.
 *         text/plain:
 *           schema:
 *             type: string
 *             description: risultato operazione
 *             example: email non registrata
 */
app.get('/api/wallet/saldo/:email', function (req, res) {
    const saldo = db.prepare(`SELECT saldo FROM Clienti WHERE email='${req.params.email}'`).all()[0];
    if (saldo) {
        res.send(saldo);
    } else {
        res.status(404);
        res.send("email non registrata")
    }
});

/**
 * @swagger
 * /api/wallet/ricarica:
 *   post:
 *     tags:
 *       - utenti
 *     summary: ricarica wallet.
 *     description: ricarica wallet di un utente.
 *     requestBody:
 *       descrizione: quantità ricarica con l'utente a cui ricaricare il wallet
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
 *                  example: Pluto@GoToDeMail.com
 *     responses:
 *       200:
 *         description: ricarica eseguita.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 risposta:
 *                   type: boolean
 *                   description: risultato operazione
 *                   example: true
 *                 messaggio:
 *                   type: string
 *                   description: risultato operazione
 *                   example: ricarica effettuata
 *       400:
 *         description: ricarica fallita.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 risposta:
 *                   type: boolean
 *                   description: risultato operazione
 *                   example: false
 *                 messaggio:
 *                   type: string
 *                   description: risultato operazione
 *                   example: richiesta malformata
 */
app.post('/api/wallet/ricarica', function (req, res) {
    const { body: { email, ricarica } } = req;
    const utente = db.prepare("SELECT * FROM Clienti WHERE email=?").all(email)[0];
    if (utente && ricarica > 0) {
        db.prepare(`UPDATE Clienti SET saldo=saldo+? WHERE email=?`).run(ricarica, email);
        res.send({ risposta: true, messaggio: "ricarica effettuata" });
    } else {
        res.status(400);
        res.send({ risposta: false, messaggio: "richiesta malformata" })
    }
});

//PREORDINE

/**
 * @swagger
 * /api/preordine/converti:
 *   post:
 *     tags:
 *       - preordini
 *     summary: converti un preordine.
 *     description: il preordine è stato pagato e viene convertito.
 *     requestBody:
 *       description: id del preordine da modificare e metodo pagamento (scelto tra wallet, pagopa e paypal)
 *       required: true
 *       content:
 *         application/json:
 *           description: il preordine è stato pagato e viene convertito.
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                  type: integer
 *                  description: id del preordine da modificare
 *                  example: 1
 *               metodoPagamento:
 *                  type: string
 *                  description: metodo pagamento
 *                  example: wallet
 *     responses:
 *       200:
 *         description: risultato operazione.
 *         content:
 *           application/json:
 *             schema:
 *                 type: object
 *                 properties:
 *                   risultato:
 *                     type: boolean
 *                     description: risultato operazione.
 *                     example: true
 *                   descrizione:
 *                     type: string
 *                     description: specifica operazione.
 *                     example: preordine convertito
 *       400:
 *         description: richiesta malformata.
 *         content:
 *           application/json:
 *             schema:
 *                 type: object
 *                 properties:
 *                   risultato:
 *                     type: boolean
 *                     description: risultato operazione.
 *                     example: false
 *                   descrizione:
 *                     type: string
 *                     description: specifica operazione.
 *                     example: richiesta malformata
 *       402:
 *         description: saldo insufficiente.
 *         content:
 *           application/json:
 *             schema:
 *                 type: object
 *                 properties:
 *                   risultato:
 *                     type: boolean
 *                     description: risultato operazione.
 *                     example: false
 *                   messaggio:
 *                     type: string
 *                     description: specifica operazione.
 *                     example: saldo insufficiente
 */
app.post('/api/preordine/converti', function (req, res) {
    const preordine = db.prepare("SELECT cliente, totale, tipo FROM Ordini WHERE id=?").all(req.body.id)[0];
    let saldoSuff = true, saldo;

    if (preordine && preordine.tipo == 'P' && ['wallet', 'pagopa', 'paypal'].indexOf(req.body.metodoPagamento) != -1) {
        if (req.body.metodoPagamento == 'wallet') {
            saldo = db.prepare('SELECT saldo FROM Clienti WHERE email=?').all(preordine.cliente)[0].saldo;
            if (saldo >= preordine.totale) {
                db.prepare("UPDATE Clienti SET saldo = saldo - ? WHERE email=?").run(preordine.totale, preordine.cliente);
            } else {
                saldoSuff = false;
            }
        }

        if (saldoSuff) {
            db.prepare(`UPDATE Ordini SET tipo='O', stato='inLavorazione', metodoPagamento=? WHERE id=${req.body.id}`).run(req.body.metodoPagamento);
            res.send({ risultato: true, messaggio: "preordine convertito" });
        } else {
            res.status(402)
            res.send({ risultato: false, messaggio: "saldo insufficiente" });
        }
    } else {
        res.status(400)
        res.send({ risultato: false, messaggio: "richiesta malformata" });
    }

});

//PRODUTTORE

/**
 * @swagger
 * /api/produttore/dettaglio_ordini:
 *   get:
 *     tags:
 *       - produttore
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
 *                     example: 1
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
app.get('/api/produttore/dettaglio_ordini', function (req, res) {
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
 *     tags:
 *       - gestionale
 *     summary: giacenza.
 *     description: modifica la disponibilità di un vino.
 *     requestBody:
 *       description: vino da modificare con relavita nuova disponibilità
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
    let modifiche;

    if (quantita >= -1) { //-1 sta per prodotto non più rifornito
        modifiche = db.prepare(`UPDATE Vini SET disponibilita = ${quantita} WHERE nome='${nomeVino}'`).run();
        if (modifiche.changes > 0) {
            res.send("vino specificato modificato")
        } else {
            res.status(400);
            res.send("il vino che si vuole modificare non esiste")
        }
    } else {
        res.status(400);
        res.send("la quantità specificata non è valida");
    }
});

/**
 * @swagger
 * /api/gestionale/creaVino:
 *   post:
 *     tags:
 *       - gestionale
 *     summary: aggiungi vino.
 *     description: aggiungi un vino.
 *     requestBody:
 *       description: dati di inserimento del nuovo vino
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nomeVino:
 *                  type: string
 *                  description: nome del vino da aggiungere
 *                  example: Sauvignon riserva
 *               annata:
 *                  type: integer
 *                  description: annata del vino
 *                  example: 2015
 *               descrizione:
 *                  type: string
 *                  description: descrizione del vino
 *                  example: vino eccelso da note amare che non dispiacciono
 *               disponibilita:
 *                  type: integer
 *                  description: disponibilità del vino
 *                  example: 56
 *               prezzo:
 *                  type: float
 *                  description: prezzo del vino
 *                  example: 15.3
 *     responses:
 *       200:
 *         description: operazione avvenuta.
 *         content:
 *           text/plain:
 *             schema:
 *                type: string
 *                description: risultato operazione
 *                example: vino inserito
 *       400:
 *         description: dati errati.
 *         content:
 *           text/plain:
 *             schema:
 *                type: string
 *                description: risultato operazione
 *                example: richiesta malformata
 */
app.post('/api/gestionale/creaVino', function (req, res) {
    const { body: { nomeVino, annata, descrizione, disponibilita, prezzo } } = req;

    if (nomeVino != "" && descrizione != "" && disponibilita > 0 && prezzo > 0.0 && annata <= (new Date().getFullYear())) {
        try {
            db.prepare("INSERT INTO Vini VALUES (?,?,?,?,?)").run(nomeVino, annata, descrizione, disponibilita, prezzo);
            res.send("vino inserito");
        } catch (e) {
            res.status(400);
            res.send("vino già presente");
        }
    } else {
        res.status(400);
        res.send("richiesta malformata");
    }
});

/**
 * @swagger
 * /api/gestionale/modifica_stato_ordine:
 *   post:
 *     tags:
 *       - gestionale
 *     summary: stato ordine.
 *     description: modifica lo stato di un ordine.
 *     requestBody:
 *       description: nuovi dati di ordine. qr (non implementato poi nel fron-end) e locker possono essere vuoti nel caso in cui si stia evadendo l'ordine
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idOrdine:
 *                  type: integer
 *                  description: id dell'ordine
 *                  example: 1
 *               stato:
 *                  type: string
 *                  description: nuovo stato dell'ordine
 *                  example: daRitirare
 *               qr:
 *                  type: string
 *                  description: qr dell'ordine
 *                  example: string
 *               locker:
 *                  type: integer
 *                  description: numero del locker in cui l'ordine si trova
 *                  example: 5
 *     responses:
 *       200:
 *         description: operazione avvenuta.
 *         content:
 *           text/plain:
 *             schema:
 *                type: string
 *                description: risultato operazione
 *                example: ordine modificato
 *       400:
 *         description: dati errati.
 *         content:
 *           text/plain:
 *             schema:
 *                type: string
 *                description: risultato operazione
 *                example: richiesta malformata
 */
app.post('/api/gestionale/modifica_stato_ordine', function (req, res) {
    const { body: { idOrdine, stato } } = req;
    const data = new Date().toISOString().replace('Z', '').replace('T', ' ');
    let modifiche;
    const ordine = db.prepare("SELECT * FROM Ordini WHERE id=?").all(idOrdine)[0];

    if (ordine && ordine.tipo == "O") {
        switch (stato) {
            case "daRitirare":
                if (req.body.qr && req.body.locker && req.body.locker > 0 && ordine.stato == "inLavorazione") {
                    modifiche = db.prepare("UPDATE Ordini SET stato=?, data_ritirabile=?, qr=?, locker=? WHERE id=?").run(stato, data, req.body.qr, req.body.locker, idOrdine);
                    res.send("ordine modificato");
                } else {
                    res.status(400);
                    res.send("dati necessari non specificati o ordine non in lavorazione")
                }
                break;

            case "evaso":
                if (ordine.stato == "daRitirare") {
                    modifiche = db.prepare("UPDATE Ordini SET stato=?, data_ritirato=? WHERE id=?").run(stato, data, idOrdine);
                    res.send("ordine modificato");
                } else {
                    res.status(400);
                    res.send("l'ordine non è in ritiro")
                }
                break;

            default:
                res.status(400);
                res.send("richiesta malformata")
        }
    } else {
        res.status(400);
        res.send("ordine inesistente")
    }
});

app.listen(8080, function () {
    console.log('GoTodeVin listening on port 8080!');
});

module.exports ={
    app,
    db,
};