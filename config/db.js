// db.js

const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://AbhishekDb:Abhishek@cluster0.bm2nmnb.mongodb.net/codeclassroom', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

module.exports = mongoose;
