const mongoose = require('mongoose');
const grid = require('gridfs-stream');

const AudioDb = require('./audio_db');
const CaptionsModel = require('../models/captions_model');
const WordstampModel = require('../models/wordstamp_model');
const WordstampSchema = require('../schemas').WordstampSchema;

var gfs = null;
var connection = mongoose.connection;
connection.once('connected', () => {
	gfs = grid(connection.db, mongoose.mongo);
});

function waitForGfs(resolve) {
	if (1 !== connection.readyState) {
		setTimeout(waitForGfs.bind(this, resolve), 30);
	}
	else {
		resolve();
	}
}

exports.saveWord = (word) => {
	if (null === word || 
		!(word instanceof WordstampSchema)) {
		return;
	}

	return new WordstampModel({
		"id": word.id,
		"word": word.word,
		"start": word.start,
		"end": word.end
	}).save();
};

exports.getWords = (id) => {
	var localSrc;
	return AudioDb.query({ "id": id })
	.then((metas) => {
		if (metas.length > 0 && 
			"SYNTHESIZED" === metas[0].source) {
			return exports.getScript(id);
		}
		return WordstampModel.find({ "id": id }).exec();
	})
	.then((captions) => {
		return captions.sort((a, b) => a.start - b.start);
	});
};

exports.saveCaptions = (id, script) => {
	return Promise.all(script.map((word) => {
		if (!word instanceof WordstampSchema) {
			return null;
		}

		return WordstampModel.findOne({
			"id": word.id,
			"word": word.word,
			"start": word.start,
			"end": word.end,
		}).exec();
	}))
	.then((wordInfos) => {
		if (!wordInfos.every((info) => null !== info)) {
			throw "word script not found";
		}
		
		return new CaptionsModel({
			"id": id,
			"script": wordInfos.map((info) => info._id)
		}).save();
	})
};

exports.getCaptions = (id) => {
	return CaptionsModel.findOne({"id": id}).exec()
	.then((info) => {
		if (info) {
			return WordstampModel.find({
				"_id": { $in: info.script }
			}).exec();
		}
		return []; // empty caption
	});
};
