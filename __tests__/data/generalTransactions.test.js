import SQLite from 'react-native-sqlite-storage';
import {
  appVersion,
  getSettings,
  getVersion,
  runSQL,
  updateValue,
  upgradeDB,
} from '../../data/Database/generalTransactions';
import upgradeJSON from '../../data/Database/upgrades/user-info-db-upgrade.json';

let userDB;

beforeAll(async () => {
  userDB = SQLite.openDatabase('UserInfo.db');
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
  ).then(res => {
    resetDay = res.rows.item(0).Value;
  });

  expect(version).toBe(2);
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
  expect(currVersion).toBe('1.0.0');
});

test('appVersion run 2', async () => {
  let {prevVersion, currVersion} = await appVersion(userDB);

  expect(prevVersion).toBe('1.0.0');
  expect(currVersion).toBe('1.0.0');
});

test('updateValue', async () => {
  await updateValue(userDB, 'tblUserPrefs', 1, 'Name', 'Changed');

  let result = await runSQL(
    userDB,
    'SELECT Name FROM tblUserPrefs WHERE ID=1;',
  );
  expect(result.rows.item(0).Name).toBe('Changed');
});
