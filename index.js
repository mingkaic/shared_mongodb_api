const mongoose = require('mongoose');
const grid = require('gridfs-stream');

require('./connect_mongo');

var AudioSchema = require('./_schemas/audio_schema');

var AudioModel = require('./_models/audio_model');
var PopularModel = require('./_models/popular_model');

var gfs = null;
var connection = mongoose.connection;
connection.once('connected', () => {
	gfs = grid(connection.db, mongoose.mongo);
});

function waitForGfs(resolve) {
    if (null === gfs) {
        setTimeout(waitForGfs.bind(this, resolve), 30);
	}
	else {
		resolve();
	}
}

// >>>> AUDIO MODEL <<<<
// ACCESSOR
exports.audioQuery = (query, limit) => { // get metadata
	var allQuery = AudioModel.find(query);
	allQuery = allQuery.limit(limit);
	return allQuery.exec();
};

exports.getAudio = (id) => { // get audio stream
	return AudioModel.findOne({ "id": id }).exec()
	.then((info) => {
		var aud = null;
		if (info) {
			aud = gfs.createReadStream({ filename: id });
		}
		return aud;
	});
};

// MUTATOR
exports.updateAudioTitle = (id, title) => { // set metadata
	return AudioModel.findOne({ "id": id }).exec()
	.then((info) => {
		if (info === null) {
			return null;
		}
		info.title = title;
		return info.save()
		.then((data) => {
			console.log('saved ', data);
		});
	});
};

exports.audioSave = (audios) => { // set audio stream and metadata
	return new Promise(waitForGfs)
	.then(() => {
		return Promise.all(audios.map((aud) => {
			if (null === aud || 
				!(aud instanceof AudioSchema) ||
				null == aud.audio) {
				return null;
			}

			// save to database
			var writeStream = gfs.createWriteStream({ filename: aud.id });
			aud.audio.pipe(writeStream);
			
			var instance = new AudioModel({
				'id': aud.id,
				'source': aud.source,
				'title': aud.title
			});
			
			return new Promise((resolve, reject) => {
				writeStream
				.on('close', resolve)
				.on('error', reject);
			})
			.then(() => {
				return instance.save();
			})
			.then((data) => {
				console.log(aud.id, " saved");
			});
		}));
	})
	.then(() => {
		return audios.map((aud) => aud.id);
	});
};

// >>>> POPULAR MODEL <<<<
// ACCESSOR
exports.popularQuery = () => {
	var today = Math.floor(Date.now() / 1000);
	return PopularModel.findOne({ "date": today }).exec()
	.then((data) => {
		var ids = []
		if (data) {
			ids = data.ids;
		}
		return ids;
	});
};

// MUTATOR
exports.popularSave = (ids) => {
	console.log('saving to popular')
    var today = Math.floor(Date.now() / 1000);
    return new PopularModel({
        'date': today,
        'ids': ids
    }).save();
};
