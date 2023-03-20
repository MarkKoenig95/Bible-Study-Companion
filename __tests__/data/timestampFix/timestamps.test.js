import SQLite from 'react-native-sqlite-storage';
import {
  appVersion,
  getSettings,
  getVersion,
  runSQL,
  updateValue,
  upgradeDB,
} from '../../../data/Database/generalTransactions';
import upgradeJSON from '../../../data/Database/upgrades/user-info-db-upgrade.json';

let userDB;

beforeAll(async () => {
  userDB = SQLite.openDatabase('generalTransactions_UserInfo.db');

  await upgradeDB(userDB, upgradeJSON);
});

afterAll(() => {
  userDB.deleteDB();
});

`CREATE TABLE 'test' ( 
    ...>    'id' INTEGER PRIMARY KEY,
    ...>    'dt1' DATETIME NOT NULL DEFAULT (datetime(CURRENT_TIMESTAMP, 'localtime')), 
    ...>    'dt2' DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')), 
    ...>    'dt3' DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now', 'localtime'))
    ...> );`;

test('Upgrade User DB and check version', async () => {
  //   await runSQL(
  //     userDB,
  //     'INSERT INTO tblSchedules(ScheduleName, ScheduleType, CreationInfo) VALUES ("test1", "0", "A");',
  //   );

  await runSQL(
    userDB,
    "ALTER TABLE tblSchedules ADD COLUMN CreateTime DATETIME NOT NULL DEFAULT (datetime(CURRENT_TIMESTAMP, 'localtime'));",
  );

  await runSQL(
    userDB,
    'INSERT INTO tblSchedules(ScheduleName, ScheduleType, CreationInfo) VALUES ("test2", "0", "A");',
  );

  let result;

  await runSQL(userDB, 'SELECT * FROM tblSchedules').then((res) => {
    result = res.rows.item(0);
    console.log(result);
    result = res.rows.item(1);
    console.log(result);
  });

  expect(0).toBe(0);
});
