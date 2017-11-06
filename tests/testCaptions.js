const chai = require('chai');
const clean = require('mongo-clean');
const mongoose = require('mongoose');
const uuidv1 = require('uuid/v1');

// connect mongoose to mongo then get service
const schemas = require('../schemas');
const db = require('../index').captions;
const CaptionsSchema = schemas.CaptionsSchema;
const WordstampSchema = schemas.WordstampSchema;

const expect = chai.expect; // we are using the "expect" style of Chai
const mongoURL = require('../connect_mongo').url;
const testIds = ['test_id1A2B3C', 'test_id2A1B3C', 'test_id3A2B1C'];

// behavior when database is empty
describe('Captions Database (When Empty)', function() {
	it('getWord should return an empty list', 
	function(done) {
		db.getWords(testIds[0])
		.then((captions) => {
			expect(captions.length).to.equal(0);
			done();
		})
		.catch(done);
	});

	it('getCaptions should return an empty list', 
	function(done) {
		db.getCaptions(testIds[0])
		.then((captions) => {
			expect(captions.length).to.equal(0);
			done();
		})
		.catch(done);
	});
});

const test_captions = [
	new WordstampSchema({
		"id": testIds[0],
		"word": 'WORD_A',
		"start": 0,
		"end": 1
	}),
	new WordstampSchema({
		"id": testIds[1],
		"word": 'WORD_B',
		"start": 0,
		"end": 1
	})
];

// behavior when database already has an entry
describe('Captions Database (With An Entry)', function() {
	before((done) => {
		db.saveWord(test_captions[0])
		.then(() => db.saveWord(test_captions[1]))
		.then(() => db.saveCaptions(testIds[2], test_captions))
		.then(() => {
			done();
		})
		.catch(done);
	});

	it('getWord should return a list with the WORD_A', 
	function(done) {
		db.getWords(testIds[0])
		.then((captions) => {
			expect(captions.length).to.equal(1);
			expect(captions[0].id).to.equal(test_captions[0].id);
			expect(captions[0].word).to.equal(test_captions[0].word);
			expect(captions[0].start).to.equal(test_captions[0].start);
			expect(captions[0].end).to.equal(test_captions[0].end);
			done();
		})
		.catch(done);
	});

	it('getCaptions should return an empty list', 
	function(done) {
		db.getCaptions(testIds[2])
		.then((captions) => {
			expect(captions.length).to.equal(2);
			for (var i = 0; i < 2; i++) {
				expect(captions[i].id).to.equal(test_captions[i].id);
				expect(captions[i].word).to.equal(test_captions[i].word);
				expect(captions[i].start).to.equal(test_captions[i].start);
				expect(captions[i].end).to.equal(test_captions[i].end);
			}
			done();
		})
		.catch(done);
	});
	
	after(function(done) {
		clean(mongoURL, function (err, db) {
			done();
		});
	});
});
