import React from 'react';
import SQLite from 'react-native-sqlite-storage';
import bibleInfoDBUpgrade from './upgrades/bible-info-db-upgrade.json';
import userInfoDBUpgrade from './upgrades/user-info-db-upgrade.json';
import {upgradeDB} from './generalTransactions';

export function errorCB(err) {
  console.log('SQL Error: ' + err.message);
}

class Database {
  constructor(databaseName, upgradeJSON) {
    this.databaseName = databaseName;
    this.upgradeJSON = upgradeJSON;
  }

  getConnection() {
    let conn = SQLite.openDatabase(
      {name: this.databaseName, createFromLocation: 1},
      db => {
        console.log('Database', this.databaseName, 'OPENED');
        upgradeDB(db, this.upgradeJSON);
      },
      errorCB,
    );

    return conn;
  }
}

export const BibleInfoDB = new Database(
  'BibleStudyCompanion.db',
  bibleInfoDBUpgrade,
);
export const UserInfoDB = new Database('UserInfo.db', userInfoDBUpgrade);
