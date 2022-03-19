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
  constructor(openArgs, upgradeJSON) {
    this.openArgs = openArgs;
    this.upgradeJSON = upgradeJSON;
  }

  async getConnection() {
    let db = await SQLite.openDatabase(this.openArgs).catch(errorCB);
    let DB = await upgradeDB(db, this.upgradeJSON).catch(errorCB);

    console.log('Database', this.openArgs.name, 'OPENED');

    return DB;
  }
}

export const BibleInfoDB = new Database(
  {
    name: 'BibleStudyCompanion.db',
    createFromLocation: 1,
  },
  bibleInfoDBUpgrade,
);
export const UserInfoDB = new Database(
  {
    name: 'UserInfo.db',
    location: 'default',
  },
  userInfoDBUpgrade,
);
