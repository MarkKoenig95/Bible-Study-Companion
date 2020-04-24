import React from 'react';
import SQLite from 'react-native-sqlite-storage';

export function errorCB(err) {
  console.log('SQL Error: ' + err.message);
}

export function successCB() {
  console.log('SQL executed fine');
}

function openCB() {
  console.log('Database OPENED');
}

var databaseName = 'BibleStudyCompanion.db';

let conn = SQLite.openDatabase(
  {name: databaseName, createFromLocation: 1},
  openCB,
  errorCB,
);

class Database {
  getConnection() {
    return conn;
  }
}

export default new Database();
