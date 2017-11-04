const mongoose = require('mongoose');
const schemas = require('./schemas');
require('./connect_mongo');

exports.AudioSchema = schemas.AudioSchema;
exports.WordstampSchema = schemas.WordStampSchema;

exports.audio = require('./api/audio_db');
exports.captions = require('./api/captions_db');
