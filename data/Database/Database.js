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

class Database {
  constructor(databaseName) {
    this.databaseName = databaseName;
  }
  getConnection() {
    let conn = SQLite.openDatabase(
      {name: this.databaseName, createFromLocation: 1},
      openCB,
      errorCB,
    );

    return conn;
  }
}

export const BibleInfoDB = new Database('BibleStudyCompanion.db');
export const ScheduleInfoDB = new Database('ScheduleInfo.db');
