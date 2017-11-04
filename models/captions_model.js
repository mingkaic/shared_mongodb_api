const mongoose = require('mongoose');

const CaptionsSchema = new mongoose.Schema({
	"id": String,
	"script": [{
		type: mongoose.Schema.Types.ObjectId, 
		ref: 'wordstamp'
	}]
});

module.exports = mongoose.model('captions', CaptionsSchema);
