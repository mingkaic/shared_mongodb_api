const mongoose = require('mongoose');

const PopSchema = new mongoose.Schema({
	"date": { type: Number, unique: true },
    "ids": [String]
});

module.exports = mongoose.model('popular', PopSchema);
