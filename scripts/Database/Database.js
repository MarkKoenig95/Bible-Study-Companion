import React from 'react';
import SQLite from 'react-native-sqlite-storage';

// SQLite.DEBUG(true);

function errorCB(err) {
  console.log('SQL Error: ' + err);
}

function successCB() {
  console.log('SQL executed fine');
}

function openCB() {
  console.log('Database OPENED');
}

var databaseName = 'BibleStudyCompanion.db';

let conn = SQLite.openDatabase(
  { name: databaseName, createFromLocation: 1 },
  openCB,
  errorCB,
);

class Database {
  getConnection() {
    return conn;
  }
}

module.exports = new Database();
module.exports.errorCB = errorCB;
