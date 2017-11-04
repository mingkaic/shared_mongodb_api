const SchemaObject = require('schema-object');

exports.AudioSchema = new SchemaObject({
	"id": String,
	"source": String,
	"title": String,
	"audio": 'any',
});

exports.WordstampSchema = new SchemaObject({
	"id": String,
	"word": String,
	"start": Number,
	"end": Number
});
