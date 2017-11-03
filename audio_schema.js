const SchemaObject = require('schema-object');

module.exports = new SchemaObject({
	"id": String,
	"source": String,
	"title": String,
	"audio": 'any',
});
