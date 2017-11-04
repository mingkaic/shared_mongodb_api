const mongoose = require('mongoose');

const AudSchema = new mongoose.Schema({
	"id": { type: String, unique: true },
	"source": String,
	"title": String,
	"added_on": { type: Date, default: Date.now },
	"last_updated": { type: Date, default: Date.now },
});

AudSchema.pre('save', function (next) {
	this.update({}, {
		$set: {
			last_updated: new Date()
		}
	});
	next();
});

module.exports = mongoose.model('audios', AudSchema);
