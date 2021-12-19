var test = require('tape');
var request = require('supertest');

let {app,db} = require('../');
let idPreorder;

/*

API CATALOGO

*/

test('API 0: Catalog', function (assert) {
    request(app)
        .get('/api/catalogo/vini')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            var expectedResult = db.prepare(`SELECT nome, annata, prezzo FROM Vini WHERE disponibilita > 0`).all();

            assert.error(err, 'No error');
            assert.same(res.body, expectedResult, 'wines as expected');
            assert.end();
        });
});

test('API 1: Search wine', function (assert) {
    request(app)
        .get('/api/catalogo/ricerca/Sauvignon&2016')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            var expectedResult = db.prepare(`SELECT nome,annata FROM Vini WHERE nome LIKE ? AND annata = ? AND disponibilita > 0`).all('%Sauvignon%',2016);

            assert.error(err, 'No error');
            assert.same(res.body, expectedResult, 'correct wine');
            assert.end();
        });
});

test('API 2: wine\'s details', function (assert) {
    request(app)
        .get('/api/catalogo/dettaglio/Sauvignon')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            var expectedResult = db.prepare(`SELECT * FROM Vini WHERE nome LIKE 'Sauvignon'`).all()[0];

            assert.error(err, 'No error');
            assert.same(res.body, expectedResult, 'details found');
            assert.end();
        });
});

test('API 2.1: wine\'s details not found', function (assert) {
    request(app)
        .get('/api/catalogo/dettaglio/Sauvgnon')
        .expect(404)
        .end(function (err, res) {
            assert.error(err, 'No error');
            assert.same(res.text,'vino non trovato' , 'details not found');
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

            assert.error(err, 'No error');
            assert.same(res.body, expectedResult, 'Operators found');
            assert.end();
        });
});

/*

API ORDINI

*/

test('API 4: Customer\'s orders', function (assert) {
    request(app)
        .get('/api/ordini/TEST')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            var expectedResult = db.prepare(`SELECT id, tipo, stato, totale, data_creazione, data_ritirabile FROM Ordini WHERE cliente='TEST'`).all();

            assert.error(err, 'No error');
            assert.same(res.body, expectedResult, 'Customer\'s orders found');
            assert.end();
        });
});

test('API 4.1: Customer\'s orders not found', function (assert) {
    request(app)
        .get('/api/ordini/TEST1')
        .expect(404)
        .end(function (err, res) {
            assert.error(err, 'No error');
            assert.same(res.text, 'utente non registrato', 'Customer\'s orders not found');
            assert.end();
        });
});

test('API 5: Order\'s details', function (assert) {
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
            assert.error(err, 'No error');
            assert.same(res.body, expectedResult, 'details found');
            assert.end();
        });
});

test('API 5.1: Order\'s details not found', function (assert) {
    request(app)
        .get('/api/ordini/dettaglio/-1')
        .expect(404)
        .end(function (err, res) {
            assert.error(err, 'No error');
            assert.same(res.text, 'ordine inesistente', 'order not found');
            assert.end();
        });
});

/*

API CARRELLO

*/

test('API 6: Shopping cart\'s details', function (assert) {
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

            assert.error(err, 'No error');
            assert.same(res.body, expectedResult, 'User\'s cart');
            assert.end();
        });
});

test('API 6.1: Shopping cart\'s details not found', function (assert) {
    request(app)
        .get('/api/carrello/TEST1')
        .expect(404)
        .end(function (err, res) {;
            
            assert.error(err, 'No error');
            assert.same(res.text, 'utente non registrato', 'User not found');
            assert.end();
        });
});

test('API 7: Edit shopping cart', function (assert) {
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

            assert.error(err, 'No error');
            assert.same(res.body.risultato,true, 'shopping cart edited');
            assert.end();
        });
});

test('API 7.1: Update shopping cart', function (assert) {
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

            assert.error(err, 'No error');
            assert.same(res.body, expectedResult, 'updated quantity');
            assert.end();
        });
});

test('API 7.2: Edit shopping cart error', function (assert) {
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

            assert.error(err, 'No error');
            assert.same(res.body.risultato,false, 'shopping cart not edited');
            assert.end();
        });
});

test('API 8: Delete shopping cart\'s items', function (assert) {
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

            assert.error(err, 'No error');
            assert.same(res.text,'eliminato', 'Removed shopping cart item');
            assert.end();
        });
});

test('API 8.1: Delete shopping cart\'s items not found', function (assert) {
    request(app)
        .del('/api/carrello/modifica')
        .send({
            "nome": "Sauvi lusiv",
            "email": "TEST"
          })
        .expect(400)
        .end((err, res) => {
            assert.error(err, 'No error');
            assert.same(res.text,'vino non presente nel carrello', 'shopping cart item not found');
            assert.end();
        });
});

test('API 9: Add shopping cart\'s items', function (assert) {
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

            assert.error(err, 'No error');
            assert.same(res.body.aggiunto,true, 'items added to shopping cart');
            assert.end();
        });
});

test('API 9.1: Add shopping cart\'s items not found', function (assert) {
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
            assert.error(err, 'No error');
            assert.same(res.body.aggiunto,false, 'items not found');
            assert.end();
        });
});


test('API 10: Create oreder/preorder', function (assert) {
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

            assert.error(err, 'No error');
            assert.same(res.text,'ordine creato', 'order/preorder created');
            assert.end();
            idPreorder = db.prepare("SELECT id FROM Ordini WHERE cliente=? AND tipo=?").all("TEST", "P")[0].id;
        });
});

test('API 9: Restore shopping cart\'s items', function (assert) {
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

            assert.error(err, 'No error');
            assert.same(res.body.aggiunto,true, 'items added to shopping cart');
            assert.end();
        });
});

/*

API UTENTI

*/

test('API 11: Users info', function (assert) {
    request(app)
        .get('/api/utenti')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            var expectedResult = db.prepare(`SELECT email, name FROM Clienti`).all();

            assert.error(err, 'No error');
            assert.same(res.body, expectedResult, 'Users info found');
            assert.end();
        });
});

test('API 12: User info', function (assert) {
    request(app)
        .get('/api/utenti/TEST')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            var expectedResult = db.prepare(`SELECT email, name, saldo FROM Clienti WHERE email='TEST'`).all()[0];

            assert.error(err, 'No error');
            assert.same(res.body, expectedResult, 'Users info found');
            assert.end();
        });
});

test('API 13: Users Wallet', function (assert) {
    request(app)
        .get('/api/wallet/saldo/TEST')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            var expectedResult = db.prepare(`SELECT saldo FROM Clienti WHERE email='TEST'`).all()[0];

            assert.error(err, 'No error');
            assert.same(res.body, expectedResult, 'Wallet info found');
            assert.end();
        });
});

test('API 13.1: Users Wallet not found', function (assert) {
    request(app)
        .get('/api/wallet/saldo/TEST1')
        .expect(404)
        .end(function (err, res) {
            assert.error(err, 'No error');
            assert.same(res.text, 'email non registrata', 'Wallet info not found');
            assert.end();
        });
});

test('API 14: Recharge user wallet', function (assert) {
    request(app)
        .post('/api/wallet/ricarica')
        .expect('Content-Type', /json/)
        .send({
            "ricarica": 15.3,
            "email": "TEST"
        })
        .expect(200)
        .end((err, res) => {
            assert.error(err, 'No error');
            assert.same(res.body.risposta,true, 'wallet recharged');
            assert.end();
        });
});

test('API 14.1: Recharge user wallet failed', function (assert) {
    request(app)
        .post('/api/wallet/ricarica')
        .expect('Content-Type', /json/)
        .send({
            "ricarica": 15.3,
            "email": "TES"
        })
        .expect(400)
        .end((err, res) => {
            assert.error(err, 'No error');
            assert.same(res.body.risposta,false, 'wallet not recharged');
            assert.end();
        });
});

test('API 15: convert preorder', function (assert) {
    request(app)
        .post('/api/preordine/converti')
        .expect('Content-Type', /json/)
        .send({
            "id": idPreorder,
            "metodoPagamento": "wallet"
        })
        .expect(200)
        .end((err, res) => {
            assert.error(err, 'No error');
            assert.same(res.body.risultato,true, 'preorder converted');
            assert.end();
            db.prepare("DELETE FROM Ordini WHERE id=?").run(idPreorder);
        });
});

test('API 15.1: convert preorder failed', function (assert) {
    request(app)
        .post('/api/preordine/converti')
        .expect('Content-Type', /json/)
        .send({
            "id": -1,
            "metodoPagamento": "wallet"
        })
        .expect(400)
        .end((err, res) => {
            assert.error(err, 'No error');
            assert.same(res.body.risultato,false, 'preorder converted');
            assert.end();
        });
});

/*
test('API 15.2: convert preorder failed: insufficant wallet', function (assert) {
    request(app)
        .post('/api/preordine/converti')
        .expect('Content-Type', /json/)
        .send({
            "id": 1,
            "metodoPagamento": "wallet"
        })
        .expect(402)
        .end((err, res) => {
            assert.error(err, 'No error');
            assert.same(res.body.risultato,false, 'preorder converted');
            assert.end();
        });
});
*/

test('API 16: All orders', function (assert) {
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

            assert.error(err, 'No error');
            assert.same(res.body, expectedResult, 'orders found');
            assert.end();
        });
});

test('API 17: edit quantity', function (assert) {
    request(app)
        .post('/api/gestionale/giacenza')
        .send({
            "quantita": 200,
            "nomeVino": "Sauvignon Exclusiv"
        })
        .expect(200)
        .end((err, res) => {
            assert.error(err, 'No error');
            assert.same(res.text,'vino specificato modificato', 'quantity edited');
            assert.end();
        });
});

test('API 17.1: edit quantity failed', function (assert) {
    request(app)
        .post('/api/gestionale/giacenza')
        .send({
            "quantita": 200000000,
            "nomeVino": "Savignon"
        })
        .expect(400)
        .end((err, res) => {
            assert.error(err, 'No error');
            assert.same(res.text,'il vino che si vuole modificare non esiste', 'quantity edited failed');
            assert.end();
        });
});


test('API 18: create wine', function (assert) {
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
            assert.error(err, 'No error');
            assert.same(res.text,'vino inserito', 'wine created');
            assert.end();
        });
});

test('API 18.1: create wine failed', function (assert) {
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
            assert.error(err, 'No error');
            assert.same(res.text,'vino già presente', 'wine not created');
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
            assert.error(err, 'No error');
            assert.same(res.text,'ordine modificato', 'status edited');
            assert.end();
            //resetta stato database a prima del test
            db.prepare("UPDATE Ordini SET stato='inLavorazione', qr=NULL, locker=NULL, data_ritirabile=NULL WHERE id=1").run();
        });
});

test('API 19.1: edit order status failed', function (assert) {
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
            assert.error(err, 'No error');
            assert.same(res.text,'ordine inesistente', 'edit status failed');
            assert.end();
        });
});