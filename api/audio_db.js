const mongoose = require('mongoose');
const grid = require('gridfs-stream');

const AudioModel = require('../models/audio_model');
const AudioSchema = require('../schemas').AudioSchema;

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

// >>>> AUDIO MODEL <<<<
// ACCESSOR
exports.query = (q, limit) => { // get metadata
	var allQuery = AudioModel.find(q);
	if (limit) {
		allQuery = allQuery.limit(limit);
	}
	return allQuery.exec();
};

exports.get = (id) => { // get audio stream
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
exports.updateTitle = (id, title) => { // set metadata
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
exports.save = (audios, cb, end) => { // set audio stream and metadata
	waitForGfs(() => {
		Promise.all(audios.map((aud) => {
			if (null === aud || 
				!(aud instanceof AudioSchema)) {
				// bad format
				return null;
			}
			if (null == aud.audio) {
				// audio exists in database
				cb({
					"id": aud.id,
					"source": aud.source,
					"title": aud.title
				});
				return null;
			}

			// save to database
			var writeStream = gfs.createWriteStream({ filename: aud.id });
			aud.audio.pipe(writeStream);
			
			var instance = new AudioModel({
				"id": aud.id,
				"source": aud.source,
				"title": aud.title
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
		})).then(() => {
			end();
		}).catch((err) => {
			end(err);
		});
	});
};
