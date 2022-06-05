const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
  number: String,
  provider: {type: String, uppercase: true, default: 'NO VERIFICADO'},
  ifprovider: {type: Boolean, default: false},
  active: {type: Boolean, default: true},
  editing: {type: Boolean, default: false},
  date: { type: Date, default: Date.now()}
});

module.exports = mongoose.model('Number', dataSchema);