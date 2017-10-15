const mongoose = require('mongoose');
const grid = require('gridfs-stream');

var dbName = 'sharedAudioDb';
if (process.env.NODE_ENV !== 'production') {
	dbName += '_test';
}
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = process.env.DB_PORT || '27017';

// setup grid and mongoose
const mongoURL = 'mongodb://' + dbHost + ':' + dbPort + '/' + dbName;
function connect() {
	mongoose.connect(mongoURL, { useMongoClient: true });
	grid.mongo = mongoose.mongo;
	mongoose.Promise = require('bluebird');
}
connect();

var connection = mongoose.connection;

connection.on('connected', () => {
	console.log('Mongoose connection open to ' + mongoURL);
});

connection.on('error', (err) => {  
	console.log('Mongoose connection error: ' + err);
}); 

connection.on('disconnected', () => {
	console.log('Mongoose connection disconnected'); 
});

module.exports = {
	"url": mongoURL,
	"db": dbName,
	"reconnect": connect
};
