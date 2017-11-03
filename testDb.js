const chai = require('chai');
const clean = require('mongo-clean');
const mongoose = require('mongoose');
const uuidv1 = require('uuid/v1');
const stream = require('fake-stream');

// connect mongoose to mongo then get service
const db = require('./index');
const AudioSchema = require('./audio_schema');

const expect = chai.expect; // we are using the "expect" style of Chai
const mongoURL = require('./connect_mongo').url;

function sampleAudios () {
	var length = 5 + Math.round(Math.random() * 13);
	var sample = []
	for (var i = 0; i < length; i++) {
		var mockedStream = new stream();
		sample.push(new AudioSchema({
			"id": uuidv1(),
			"source": ".test",
			"title": uuidv1(),
			"audio": mockedStream,
		}));
	}
	return sample;
};

// behavior when database is empty
describe('Audio Database (When Empty)', function() {
	it('audioSave should return a list of ids', 
	function(done) {
		this.timeout(10000);

		var testAudios = sampleAudios();
		var nulIdx = Math.floor(Math.random() * testAudios.length);
		testAudios[nulIdx].audio = null;
		var nulId = testAudios[nulIdx].id;
		var testAudiosId = new Set(testAudios.map((testAud) => testAud.id));
		var count = 0;
		db.audioSave(testAudios, (audio) => {
			count++;
			expect(testAudiosId.has(audio.id)).to.be.true;
			expect(audio.id).to.not.be.equal(nulId);
		}, 
		() => {
			console.log(count);
			expect(count).to.be.equal(testAudios.length - 1); // never count null audio
			
			clean(mongoURL, function (err, db) {
				done();
			});
		});
	});

	it('audioQuery on id should return null', 
	function(done) {
		var testAudios = sampleAudios();
		var testIds = testAudios.map((amodel) => amodel.id);
		db.audioQuery({ "id": { $in: testIds } })
		.then((infos) => {
			expect(infos.length).to.equal(0);
		
			done();
		})
		.catch(done);
	});
	
	it('getAudio should return null',
	function(done) {
		var randId = uuidv1();
		db.getAudio(randId)
		.then((strm) => {
			expect(strm).to.be.null;
			
			done();
		})
		.catch(done);
	});
});

// behavior when database already has an entry
describe('Audio Database (With An Entry)', function() {
	var savedIds = [];
	before(function(done) {
		this.timeout(10000);

		var testAudios = sampleAudios();
		db.audioSave(testAudios, (audio) => {
			savedIds.push(audio.id);
		}, 
		() => {
			done();
		});
	});

	it('audioQuery on id should return null', 
	function(done) {
		db.audioQuery({ "id": { $in: savedIds } })
		.then((infos) => {
			expect(infos.length).to.equal(savedIds.length);
			var testIdSet = new Set(savedIds);
			expect(infos.every((info) => testIdSet.has(info.id))).to.be.true;
		
			done();
		})
		.catch(done);
	});
	
	it('getAudio should return not null',
	function(done) {
		db.getAudio(savedIds[0])
		.then((strm) => {
			expect(strm).to.not.be.null;
			
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
