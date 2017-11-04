const mongoose = require('mongoose');

const WordstampSchema = new mongoose.Schema({
	"id": String,
	"word": String,
	"start": { type: Number, required: true },
	"end": { type: Number, required: true }
});

module.exports = mongoose.model('wordstamp', WordstampSchema);
