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
