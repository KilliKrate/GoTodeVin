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