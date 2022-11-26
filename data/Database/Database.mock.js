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
    let DB;
    await SQLite.openDatabase(this.openArgs)
      .then(async (db) => {
        await upgradeDB(db, this.upgradeJSON).then((res) => {
          console.log('Database', this.openArgs.name, 'OPENED');
          DB = res;
        });
      })
      .catch(errorCB);

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
    name: 'e2e_UserInfo.db',
    createFromLocation: 1,
  },
  userInfoDBUpgrade,
);
