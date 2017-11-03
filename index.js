const mongoose = require('mongoose');
const grid = require('gridfs-stream');

require('./connect_mongo');

var AudioSchema = require('./audio_schema');

var AudioModel = require('./audio_model');

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

exports.AudioSchema = AudioSchema;

// >>>> AUDIO MODEL <<<<
// ACCESSOR
exports.audioQuery = (query, limit) => { // get metadata
	var allQuery = AudioModel.find(query);
	if (limit) {
		allQuery = allQuery.limit(limit);
	}
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

// cb handles each instance of audio datum
exports.audioSave = (audios, cb, end) => { // set audio stream and metadata
	waitForGfs(() => {
		Promise.all(audios.map((aud) => {
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
				cb({
					"id": aud.id,
					"source": aud.source,
					"title": aud.title,
				});
			});
		})).then(end).catch((err) => {
			console.log(err);
			end();
		});
	});
};
