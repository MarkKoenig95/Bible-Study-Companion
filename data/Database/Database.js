import React from 'react';
import SQLite from 'react-native-sqlite-storage';
import bibleInfoDBUpgrade from './upgrades/bible-info-db-upgrade.json';
import userInfoDBUpgrade from './upgrades/user-info-db-upgrade.json';
import {upgradeDB} from './generalTransactions';

SQLite.DEBUG(false);
SQLite.enablePromise(true);

export function errorCB(err) {
  console.log('SQL Error: ' + err.message);
}

class Database {
  constructor(databaseName, upgradeJSON) {
    this.databaseName = databaseName;
    this.upgradeJSON = upgradeJSON;
  }

  async getConnection() {
    let DB;
    await SQLite.openDatabase({
      name: this.databaseName,
      createFromLocation: 1,
    })
      .then(db => {
        console.log('Database', this.databaseName, 'OPENED');
        DB = db;
        upgradeDB(db, this.upgradeJSON);
      })
      .catch(errorCB);

    return DB;
  }
}

export const BibleInfoDB = new Database(
  'BibleStudyCompanion.db',
  bibleInfoDBUpgrade,
);
export const UserInfoDB = new Database('UserInfo.db', userInfoDBUpgrade);
