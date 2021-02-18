import SQLite from 'react-native-sqlite-storage';
import {SCHEDULE_TYPES} from '../../components/popups/ScheduleTypeSelectionPopup';
import {WEEKLY_READING_TABLE_NAME} from '../../logic/logic';
import {
  formatDate,
  loadData,
  runSQL,
  upgradeDB,
} from '../../data/Database/generalTransactions';
import {
  addSchedule,
  deleteSchedule,
  updateDates,
  updateReadStatus,
  getScheduleSettings,
  setHideCompleted,
  createWeeklyReadingSchedule,
} from '../../data/Database/scheduleTransactions';
import upgradeJSON from '../../data/Database/upgrades/user-info-db-upgrade.json';

const tableName = 'tblSchedule1';
const scheduleName = 'test';
const scheduleType = SCHEDULE_TYPES.SEQUENTIAL;

let bibleDB;
let userDB;

async function getScheduleInfo() {
  let {rows} = await runSQL(userDB, 'SELECT * FROM tblSchedule1;');
  return rows;
}

async function getSchedules() {
  let {rows} = await runSQL(userDB, 'SELECT * FROM tblSchedules;');
  return rows;
}

beforeAll(async () => {
  bibleDB = SQLite.openDatabase('BibleStudyCompanion.db');

  userDB = SQLite.openDatabase('UserInfo.db');

  await upgradeDB(userDB, upgradeJSON);
});

afterAll(() => {
  userDB.deleteDB();
});

test('Create a basic bible reading schedule', async () => {
  let today = new Date();

  let promise = new Promise((resolve, reject) => {
    addSchedule(
      userDB,
      bibleDB,
      scheduleType,
      scheduleName,
      true,
      [1, 1, 1, 1, 1, 1, 1],
      1,
      1,
      1,
      1,
      'startingPortion',
      'maxPortion',
      'readingPortionDesc',
      'portionsPerDay',
      resolve,
      reject,
    );
  });

  await promise;

  let tblSchedules = await getSchedules();

  let table1 = await getScheduleInfo();

  expect(tblSchedules.length).toBe(1);

  expect(table1.length).toBe(366);

  expect(table1.item(0).ReadingPortion).toBe('Genesis 1-3');
  expect(table1.item(0).CompletionDate).toBe(formatDate(today));

  expect(table1.item(365).ReadingPortion).toBe('Revelation 22');
  today.setDate(today.getDate() + 365);
  expect(table1.item(365).CompletionDate).toBe(formatDate(today));
});

test('update read status to "Read"', async () => {
  let readingItem;
  let promise = new Promise((res, rej) => {
    updateReadStatus(userDB, tableName, 1, true, res);
  });

  await promise;

  readingItem = await getScheduleInfo();

  expect(readingItem.item(0).IsFinished).toBe(1);
});

test('update read status to "Unread"', async () => {
  let readingItem;
  let promise = new Promise((res, rej) => {
    updateReadStatus(userDB, tableName, 1, false, res);
  });

  await promise;

  readingItem = await getScheduleInfo();

  expect(readingItem.item(0).IsFinished).toBe(0);
});

test('set Hide Completed true', async () => {
  await setHideCompleted(userDB, scheduleName, true);

  let table = await getSchedules();

  expect(table.item(0).HideCompleted).toBe(1);
});

test('set Hide Completed false', async () => {
  await setHideCompleted(userDB, scheduleName, false);

  let table = await getSchedules();

  expect(table.item(0).HideCompleted).toBe(0);
});

test('getScheduleSettings', async () => {
  let {hideCompleted, doesTrack} = await getScheduleSettings(
    userDB,
    scheduleName,
  );

  expect(hideCompleted).toBe(false);
  expect(doesTrack).toBe(true);
});

test('loadData', async () => {
  let result = await loadData(userDB, tableName, true);

  expect(result[0][0].ReadingPortion).toBe('Genesis 1-3');
  expect(result[365][0].ReadingPortion).toBe('Revelation 22');
});

test('createWeeklyReadingSchedule', async () => {
  let table;
  await createWeeklyReadingSchedule(userDB, bibleDB, 0);

  table = await runSQL(userDB, `SELECT * FROM ${WEEKLY_READING_TABLE_NAME};`);

  let startDate = new Date(table.rows.item(0).CompletionDate);
  let endDate = new Date(table.rows.item(6).CompletionDate);

  expect(table.rows.length).toBe(7);
  expect(startDate.getDay()).toBe(0);
  expect(endDate.getDay()).toBe(6);
});

test('createWeeklyReadingSchedule forced', async () => {
  let table;
  await createWeeklyReadingSchedule(userDB, bibleDB, 4, true);

  table = await runSQL(userDB, `SELECT * FROM ${WEEKLY_READING_TABLE_NAME};`);

  let startDate = new Date(table.rows.item(0).CompletionDate);
  let endDate = new Date(table.rows.item(6).CompletionDate);

  expect(table.rows.length).toBe(7);
  expect(startDate.getDay()).toBe(4);
  expect(endDate.getDay()).toBe(3);
});

test('updateDates', async () => {
  let date = new Date(2021, 2, 3, 4, 5, 6, 7).toString();

  await updateDates(userDB, date, 'WeeklyReadingCurrent', () => {});

  let result = await runSQL(
    userDB,
    'SELECT * FROM tblDates WHERE Name="WeeklyReadingCurrent"',
  );

  expect(date).toBe(result.rows.item(0).Date);
});

test('deleteSchedule', async () => {
  await deleteSchedule(userDB, tableName, scheduleName);

  let table = await getSchedules();

  expect(table.length).toBe(1);
});
