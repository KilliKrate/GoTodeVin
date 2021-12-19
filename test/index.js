var test = require('tape');
var request = require('supertest');

let {app,db} = require('../');

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
