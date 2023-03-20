import SQLite from 'react-native-sqlite-storage';
import {
  appVersion,
  createTable,
  getSettings,
  getVersion,
  runSQL,
  updateValue,
  upgradeDB,
} from '../../data/Database/generalTransactions';
import upgradeJSON from '../../data/Database/upgrades/user-info-db-upgrade.json';

let userDB;

beforeAll(async () => {
  userDB = SQLite.openDatabase('generalTransactions_UserInfo.db');
});

afterAll(() => {
  userDB.deleteDB();
});

test('Upgrade User DB and check version', async () => {
  /* This is more of a soft test since many other tests require this setup and can check the other
    tables and values that they need with this test we can just make sure that the function is not
    breaking anywhere big or obvious */
  await upgradeDB(userDB, upgradeJSON);

  let version = await getVersion(userDB);
  let resetDay;

  await runSQL(
    userDB,
    'SELECT * FROM tblUserPrefs WHERE Name="WeeklyReadingResetDay";',
  ).then((res) => {
    resetDay = res.rows.item(0).Value;
  });

  expect(version).toBe(6);
  expect(resetDay).toBe(4);
});

test('getSettings', async () => {
  let {showDaily, weeklyReadingResetDay} = await getSettings(userDB);

  expect(showDaily.value).toBe(false);
  expect(weeklyReadingResetDay.value).toBe(4);
});

test('appVersion run 1', async () => {
  let {prevVersion, currVersion} = await appVersion(userDB);

  expect(prevVersion).toBe('');
  expect(currVersion).toBe('1.3.2');
});

test('appVersion run 2', async () => {
  let {prevVersion, currVersion} = await appVersion(userDB);

  expect(prevVersion).toBe('1.3.2');
  expect(currVersion).toBe('1.3.2');
});

test('updateValue', async () => {
  await updateValue(userDB, 'tblUserPrefs', 1, 'Name', 'Changed');

  let result = await runSQL(
    userDB,
    'SELECT Name FROM tblUserPrefs WHERE ID=1;',
  );
  expect(result.rows.item(0).Name).toBe('Changed');
});

test('createTable', async () => {
  await createTable(userDB, 'tblNewTable', ['Name VARCHAR(20) UNIQUE']);

  await runSQL(
    userDB,
    'INSERT INTO tblNewTable (Name) VALUES ("Hello World!")',
  );

  let result = await runSQL(userDB, 'SELECT * FROM tblNewTable;');

  let ct = new Date(result.rows.item(0).CreatedTime);
  let ut = new Date(result.rows.item(0).UpdatedTime);
  let today = new Date();

  expect(result.rows.item(0).Name).toBe('Hello World!');
  expect(ct.getFullYear()).toBe(today.getFullYear());
  expect(ct.getMonth()).toBe(today.getMonth());
  expect(ct.getDate()).toBe(today.getDate());
  expect(ct.getHours()).toBe(today.getHours());
  expect(ut.getFullYear()).toBe(today.getFullYear());
  expect(ut.getMonth()).toBe(today.getMonth());
  expect(ut.getDate()).toBe(today.getDate());
  expect(ut.getHours()).toBe(today.getHours());
});
