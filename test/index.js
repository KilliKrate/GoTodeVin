var test = require('tape');
var request = require('supertest');

const {app,db} = require('../');
let idPreorder;
let wineQuantity;
let walletValue;

let startTime = new Date();

/*

API CATALOGO

*/


test('ROUTE: /', function (assert){
    request(app)
        .get('/')
        .expect(200)
        .end(function (err) {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Found route /');
            console.log()
            assert.end();
        });
});

test('ROUTE: /carrello', function (assert){
    request(app)
        .get('/carrello')
        .expect(200)
        .end(function (err, res) {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Found route /carrello');
            console.log()
            assert.end();
        });
});

test('ROUTE: /ordini', function (assert){
    request(app)
        .get('/ordini')
        .expect(200)
        .end(function (err, res) {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Found route /ordini');
            console.log()
            assert.end();
        });
});

test('ROUTE: /ordini/id', function (assert){
    request(app)
        .get('/ordini/id')
        .expect(200)
        .end(function (err, res) {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Found route /ordini/id');
            console.log()
            assert.end();
        });
});

test('ROUTE: /assistenza', function (assert){
    request(app)
        .get('/assistenza')
        .expect(200)
        .end(function (err, res) {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Found route /assistenza');
            console.log()
            assert.end();
        });
});

test('ROUTE: /ricarica', function (assert){
    request(app)
        .get('/ricarica')
        .expect(200)
        .end(function (err, res) {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Found route /ricarica');
            console.log()
            assert.end();
        });
});

test('ROUTE: /NomeVino', function (assert){
    request(app)
        .get('/Sauvignon')
        .expect(200)
        .end(function (err, res) {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Found route /NomeVino');
            console.log()
            assert.end();
        });
});

test('API 0: Request wine\'s catalog', function (assert) {
    request(app)
        .get('/api/catalogo/vini')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            
            var expectedResult = db.prepare(`SELECT nome, annata, prezzo FROM Vini WHERE disponibilita > 0`).all();
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body, expectedResult, 'Valid list of wines');
            console.log();
            assert.end();
        });
});

test('API 1: Search specific wine', function (assert) {
    request(app)
        .get('/api/catalogo/ricerca/Sauvignon&2016')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            
            var expectedResult = db.prepare(`SELECT nome,annata FROM Vini WHERE nome LIKE ? AND annata = ? AND disponibilita > 0`).all('%Sauvignon%',2016);
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body, expectedResult, 'Valid search result');
            console.log();
            assert.end();
        });
});

test('API 2: Request valid wine\'s details', function (assert) {
    request(app)
        .get('/api/catalogo/dettaglio/Sauvignon')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            
            var expectedResult = db.prepare(`SELECT * FROM Vini WHERE nome LIKE 'Sauvignon'`).all()[0];
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body, expectedResult, 'Valid wine\'s details');
            console.log()
            assert.end();
        });
});

test('API 2.1: Request invalid wine\'s details', function (assert) {
    request(app)
        .get('/api/catalogo/dettaglio/Sauvgnon')
        .expect(404)
        .end(function (err, res) {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.text,'vino non trovato' , 'Invalid wine correctly identified');
            console.log()
            assert.end();
        });
});

/*

API ASSISTENZA

*/

test('API 3: Operator\'s contacts', function (assert) {
    request(app)
        .get('/api/assistenza')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            
            var expectedResult = db.prepare(`SELECT * FROM Operatori`).all();
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body, expectedResult, 'Valid operators');
            console.log()
            assert.end();
        });
});

/*

API ORDINI

*/

test('API 4: Valid customer\'s orders', function (assert) {
    request(app)
        .get('/api/ordini/TEST')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            
            var expectedResult = db.prepare(`SELECT id, tipo, stato, totale, data_creazione, data_ritirabile FROM Ordini WHERE cliente='TEST'`).all();
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body, expectedResult, 'valid orders');
            console.log()
            assert.end();
        });
});

test('API 4.1: Invalid customer\'s orders', function (assert) {
    request(app)
        .get('/api/ordini/TEST1')
        .expect(404)
        .end(function (err, res) {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.text, 'utente non registrato', 'Invalid customer correctly identified');
            console.log()
            assert.end();
        });
});

test('API 5: Request valid order\'s details', function (assert) {
    request(app)
        .get('/api/ordini/dettaglio/1')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            var expectedResult = {
                "id": 1,
                "tipo": "O",
                "qr": null,
                "locker": null,
                "stato": "inLavorazione",
                "totale": 46.54,
                "metodoPagamento": "pagopa",
                "data_creazione": "2021-12-19 10:49:11.252",
                "data_ritirabile": null,
                "data_ritirato": null,
                "cliente": "TEST",
                "vini": [
                  {
                    "vino": "Sauvignon",
                    "quantita": 1,
                    "subtotale": 14
                  },
                  {
                    "vino": "Solaris",
                    "quantita": 2,
                    "subtotale": 32.54
                  }
                ]
            };
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body, expectedResult, 'Valid order');
            console.log();
            assert.end();
        });
});

test('API 5.1: Invalid order\'s details', function (assert) {
    request(app)
        .get('/api/ordini/dettaglio/-1')
        .expect(404)
        .end(function (err, res) {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.text, 'ordine inesistente', 'Invalid order correctly identified');
            console.log()
            assert.end();
        });
});

/*

API CARRELLO

*/

test('API 6: Valid shopping cart\'s details', function (assert) {
    request(app)
        .get('/api/carrello/TEST')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {;
            
            var expectedResult = {
                "totale": 70,
                "elementi": [
                  {
                    "vino": "Sauvignon Exclusiv",
                    "quantita": 2,
                    "prezzo": 70
                  },
                ]
              };
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body, expectedResult, 'Valid user\'s cart');
            console.log()
            assert.end();
        });
});

test('API 6.1: Invalid shopping cart\'s details', function (assert) {
    request(app)
        .get('/api/carrello/TEST1')
        .expect(404)
        .end(function (err, res) {;
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.text, 'utente non registrato', 'Invalid user\'s cart correctly identified');
            console.log()
            assert.end();
        });
});

test('API 7: Edit valid shopping cart', function (assert) {
    request(app)
        .post('/api/carrello/modifica')
        .send({
            "quantita":8,
            "nome": "Sauvignon Exclusiv",
            "email": "TEST"
        })
        .expect('Content-Type', /json/)
        .expect(200) 
        .end((err, res) => {

            if (err) {
                reject(new Error('An error occured with the cart\'s editing API, err: ' + err))
            }
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body.risultato,true, 'Valid shopping cart');
            console.log()
            assert.end();
        });
});

test('API 7.1: Check update shopping cart', function (assert) {
    request(app)
        .get('/api/carrello/TEST')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {;
            
            var expectedResult = {
                "totale": 280,
                "elementi": [
                  {
                    "vino": "Sauvignon Exclusiv",
                    "quantita": 8,
                    "prezzo": 280
                  },                  
                ]
              };
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body, expectedResult, 'check updated quantity');
            console.log();
            assert.end();
        });
});

test('API 7.2: Edit invalid shopping cart', function (assert) {
    request(app)
        .post('/api/carrello/modifica')
        .expect('Content-Type', /json/)
        .send({
            "quantita": 8,
            "nome": "Sauvign Eclusiv",
            "email": "TESTASD"
          })
        .expect(400)
        .end((err, res) => {

            if (err) {
                reject(new Error('An error occured with the cart\'s editing API, err: ' + err))
            }
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body.risultato,false, 'Invalid shopping cart correctly identified');
            console.log()
            assert.end();
        });
});

test('API 8: Delete valid shopping cart\'s items', function (assert) {
    request(app)
        .del('/api/carrello/modifica')
        .send({
            "nome": "Sauvignon Exclusiv",
            "email": "TEST"
          })
        .expect(200)
        .end((err, res) => {

            if (err) {
                reject(new Error('An error occured with the cart\'s editing API, err: ' + err))
            }
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.text,'eliminato', 'Valid shopping cart items');
            console.log()
            assert.end();
        });
});

test('API 8.1: Check deleted shopping cart\'s items', function (assert) {
    request(app)
        .del('/api/carrello/modifica')
        .send({
            "nome": "Sauvignon Exclusiv",
            "email": "TEST"
          })
        .expect(400)
        .end((err, res) => {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.text,'vino non presente nel carrello', 'check deleted shopping cart items');
            console.log()
            assert.end();
        });
});

test('API 8.2: Delete invalid shopping cart\'s items', function (assert) {
    request(app)
        .del('/api/carrello/modifica')
        .send({
            "nome": "Sauvi lusiv",
            "email": "TEST"
          })
        .expect(400)
        .end((err, res) => {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.text,'vino non presente nel carrello', ' Invalid shopping cart items correctly not deleted');
            console.log()
            assert.end();
        });
});

test('API 9: Add valid shopping cart\'s items', function (assert) {
    request(app)
        .post('/api/carrello/aggiungi')
        .expect('Content-Type', /json/)
        .send({
            "quantita": 2,
            "nome": "Sauvignon Exclusiv",
            "email": "TEST"
        })
        .expect(200)
        .end((err, res) => {

            if (err) {
                reject(new Error('An error occured with the cart\'s editing API, err: ' + err))
            }
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body.aggiunto,true, ' valid items added');
            console.log()
            assert.end();
        });
});

test('API 9.1: Check update shopping cart', function (assert) {
    request(app)
        .get('/api/carrello/TEST')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {;
            
            var expectedResult = {
                "totale": 70,
                "elementi": [
                  {
                    "vino": "Sauvignon Exclusiv",
                    "quantita": 2,
                    "prezzo": 70
                  },                  
                ]
              };
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body, expectedResult, 'check added quantity');
            console.log();
            assert.end();
        });
});

test('API 9.2: Add invalid shopping cart\'s items', function (assert) {
    request(app)
        .post('/api/carrello/aggiungi')
        .expect('Content-Type', /json/)
        .send({
            "quantita": 2,
            "nome": "Sauvi lusiv",
            "email": "TEST"
        })
        .expect(400)
        .end((err, res) => {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body.aggiunto,false, 'Invalid items correctly identified');
            console.log()
            assert.end();
        });
});


test('API 10: Request creation order/preorder', function (assert) {
    request(app)
        .post('/api/carrello/pre-ordina')
        .send({
            "tipo": "P",
            "email": "TEST",
            "metodoPagamento": "wallet"
          })
        .expect(200)
        .end((err, res) => {

            if (err) {
                reject(new Error('An error occured with the cart\'s editing API, err: ' + err))
            }

            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.text,'ordine creato', 'valid order/preorder');
            console.log()
            assert.end();
            idPreorder = db.prepare("SELECT id FROM Ordini WHERE cliente=? AND tipo=?").all("TEST", "P")[0].id;
        });
});

test('API 10.1: Check creation order/preorder', function (assert) {
    request(app)
        .get('/api/ordini/dettaglio/'+ idPreorder)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Check creation order/preorder');
            console.log();
            assert.end();
        });
});


test('API 10.2: Restore shopping cart\'s items', function (assert) {
    request(app)
        .post('/api/carrello/aggiungi')
        .expect('Content-Type', /json/)
        .send({
            "quantita": 2,
            "nome": "Sauvignon Exclusiv",
            "email": "TEST"
        })
        .expect(200)
        .end((err, res) => {

            if (err) {
                reject(new Error('An error occured with the cart\'s editing API, err: ' + err))
            }
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body.aggiunto,true, 'restored shopping cart');
            console.log()
            assert.end();
        });
});

/*

API UTENTI

*/

test('API 11: Request users', function (assert) {
    request(app)
        .get('/api/utenti')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            var expectedResult = db.prepare(`SELECT email, name FROM Clienti`).all();
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body, expectedResult, 'Valid users');
            console.log()
            assert.end();
        });
});

test('API 12: Request user info', function (assert) {
    request(app)
        .get('/api/utenti/TEST')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            var expectedResult = db.prepare(`SELECT email, name, saldo FROM Clienti WHERE email='TEST'`).all()[0];
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body, expectedResult, 'Valid user');
            console.log()
            assert.end();
        });
});

test('API 13: Request valid user wallet', function (assert) {
    request(app)
        .get('/api/wallet/saldo/TEST')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            
            var expectedResult = db.prepare(`SELECT saldo FROM Clienti WHERE email='TEST'`).all()[0];
            walletValue = expectedResult;
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body, expectedResult, 'Valid user');
            console.log()
            assert.end();
        });
});

test('API 13.1: Request invalid users Wallet', function (assert) {
    request(app)
        .get('/api/wallet/saldo/TEST1')
        .expect(404)
        .end(function (err, res) {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.text, 'email non registrata', 'Invalid user correctly identified');
            console.log()
            assert.end();
        });
});

test('API 14: Recharge valid user wallet', function (assert) {
    request(app)
        .post('/api/wallet/ricarica')
        .expect('Content-Type', /json/)
        .send({
            "ricarica": 15.3,
            "email": "TEST"
        })
        .expect(200)
        .end((err, res) => {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body.risposta,true, 'Valid wallet');
            console.log()
            assert.end();
        });
});

test('API 14.1: Check recharge wallet', function (assert) {
    request(app)
        .get('/api/wallet/saldo/TEST')
        .expect(200)
        .end(function (err, res) {
            
            var expectedResult = db.prepare(`SELECT saldo FROM Clienti WHERE email='TEST'`).all()[0];
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            var diff = walletValue.saldo-expectedResult.saldo;
            assert.same(diff,-15.25, 'Check recharge wallet');
            console.log()
            assert.end();
        });
});

test('API 14.2: Recharge invalid user wallet', function (assert) {
    request(app)
        .post('/api/wallet/ricarica')
        .expect('Content-Type', /json/)
        .send({
            "ricarica": 15.3,
            "email": "TES"
        })
        .expect(400)
        .end((err, res) => {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body.risposta,false, 'Invalid wallet correctly deteceted');
            console.log()
            assert.end();
        });
});

test('API 15: convert valid preorder', function (assert) {
    request(app)
        .post('/api/preordine/converti')
        .expect('Content-Type', /json/)
        .send({
            "id": idPreorder,
            "metodoPagamento": "wallet"
        })
        .expect(200)
        .end((err, res) => {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body.risultato,true, 'Valid preorder converted');
            console.log()
            assert.end();
        });
});

test('API 15.1: Check converted order', function (assert) {
    request(app)
        .get('/api/ordini/dettaglio/'+ idPreorder)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body.tipo,'O' ,'Check converted order');
            db.prepare("DELETE FROM Ordini WHERE id=?").run(idPreorder);
            console.log();
            assert.end();
        });
});

test('API 15.2: Convert invalid preorder', function (assert) {
    request(app)
        .post('/api/preordine/converti')
        .expect('Content-Type', /json/)
        .send({
            "id": -1,
            "metodoPagamento": "wallet"
        })
        .expect(400)
        .end((err, res) => {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body.risultato,false, 'Invalid preorder correctly identified');
            console.log()
            assert.end();
        });
});

/*
test('API 15.2: convert preorder failed: insufficient wallet', function (assert) {
    request(app)
        .post('/api/preordine/converti')
        .expect('Content-Type', /json/)
        .send({
            "id": 1,
            "metodoPagamento": "wallet"
        })
        .expect(402)
        .end((err, res) => {
            assert.error(err, 'Request completed');
            assert.same(res.body.risultato,false, 'preorder converted');
            assert.end();
        });
});
*/

test('API 16: Request all orders', function (assert) {
    request(app)
        .get('/api/produttore/dettaglio_ordini')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            
            var expectedResult = db.prepare(`SELECT * FROM Ordini`).all();

            expectedResult.forEach((elem, ind) => {
                sql = "SELECT vino,quantita FROM Ordini_Vini WHERE ordine=" + elem.id;
                vini = db.prepare(sql).all();
                expectedResult[ind].vini = vini;
            });

            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body, expectedResult, 'Valid orders');
            console.log()
            assert.end();
        });
});

test('API 17: Request edit quantity', function (assert) {
    request(app)
        .post('/api/gestionale/giacenza')
        .send({
            "quantita": 200,
            "nomeVino": "Sauvignon Exclusiv"
        })
        .expect(200)
        .end((err, res) => {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.text,'vino specificato modificato', 'Valid edit request');
            console.log()
            assert.end();
        });
});

test('API 17.1: Check edit quantity', function (assert) {
    request(app)
        .get('/api/catalogo/dettaglio/Sauvignon%20Exclusiv')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body.disponibilita, 200, 'quantity modified');
            console.log()
            assert.end();
        });
});

test('API 17.2: Request edit with invalid quantity', function (assert) {
    request(app)
        .post('/api/gestionale/giacenza')
        .send({
            "quantita": -1000000,
            "nomeVino": "Savignon"
        })
        .expect(400)
        .end((err, res) => {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.text,'la quantit?? specificata non ?? valida', 'Invalid edit request correctly blocked');
            console.log()
            assert.end();
        });
});


test('API 18: Request creation wine', function (assert) {
    request(app)
        .post('/api/gestionale/creaVino')
        .send({
            "nomeVino": "Sauvignon riserva",
            "annata": 2015,
            "descrizione": "vino eccelso da note amare che non dispiacciono",
            "disponibilita": 56,
            "prezzo": 15.3
          })
        .expect(200)
        .end((err, res) => {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.text,'vino inserito', 'wine created');
            console.log()
            assert.end();
        });
});

test('API 18.2: Check creation wine', function (assert) {
    request(app)
        .post('/api/gestionale/creaVino')
        .send({
            "nomeVino": "Sauvignon riserva",
            "annata": 2015,
            "descrizione": "vino eccelso da note amare che non dispiacciono",
            "disponibilita": 56,
            "prezzo": 15.3
          })
        .expect(400)
        .end((err, res) => {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.text,'vino gi?? presente', 'Check creation wine');
            console.log()
            assert.end();
        });
});

test('API 18.2: Request creation invalid wine', function (assert) {
    request(app)
        .post('/api/gestionale/creaVino')
        .send({
            "nomeVino": "Sauvignon riserva",
            "annata": 2015,
            "descrizione": "vino eccelso da note amare che non dispiacciono",
            "disponibilita": 56,
            "prezzo": 15.3
          })
        .expect(400)
        .end((err, res) => {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.text,'vino gi?? presente', 'wine correctly not created');
            console.log()
            assert.end();
            //resetta stato database a prima del test
            db.prepare("DELETE FROM Vini WHERE nome=?").run("Sauvignon riserva");
        });
});


test('API 19: edit order status', function (assert) {
    request(app)
        .post('/api/gestionale/modifica_stato_ordine')
        .send({
            "idOrdine": 1,
            "stato": "daRitirare",
            "qr": "string",
            "locker": 5
        })
        .expect(200)
        .end((err, res) => {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.text,'ordine modificato', 'status edited');
            console.log()
            assert.end();
        });
});

test('API 19.1: Check edit status', function (assert) {
    request(app)
        .get('/api/ordini/dettaglio/1')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.body.stato, 'daRitirare', 'Check edit status');
            console.log()
            //resetta stato database a prima del test
            db.prepare("UPDATE Ordini SET stato='inLavorazione', qr=NULL, locker=NULL, data_ritirabile=NULL WHERE id=1").run();
            assert.end();
        });
});

test('API 19.2: edit order status with malformed input', function (assert) {
    request(app)
        .post('/api/gestionale/modifica_stato_ordine')
        .send({
            "idOrdine": -1,
            "stato": "daRitirare",
            "qr": "string",
            "locker": 5
        })
        .expect(400)
        .end((err, res) => {
            
            process.stdout.write("   \u2713  ");
            assert.error(err, 'Request completed');
            process.stdout.write("   \u2713  ");
            assert.same(res.text,'ordine inesistente', 'edit status correctly failed');
            assert.end();

            console.log("\nAll tests completed!")
            console.log("    total: 51");
            console.log("    time elapsed: "+ (new Date()-startTime) +"ms");
        });
});