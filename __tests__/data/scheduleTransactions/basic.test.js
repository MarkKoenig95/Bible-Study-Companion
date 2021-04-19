import SQLite from 'react-native-sqlite-storage';
import {
  loadData,
  runSQL,
  upgradeDB,
} from '../../../data/Database/generalTransactions';
import {
  addSchedule,
  createWeeklyReadingSchedule,
  deleteSchedule,
  findCorrespondingIndex,
  getScheduleSettings,
  renameSchedule,
  setHideCompleted,
  updateDates,
  updateMultipleReadStatus,
  updateReadStatus,
} from '../../../data/Database/scheduleTransactions';
import upgradeJSON from '../../../data/Database/upgrades/user-info-db-upgrade.json';
import {
  SCHEDULE_TYPES,
  WEEKLY_READING_TABLE_NAME,
} from '../../../logic/general';

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

  userDB = SQLite.openDatabase('scheduleTransactions_UserInfo.db');

  await upgradeDB(userDB, upgradeJSON);
});

beforeEach(async () => {
  userDB.deleteDB();
  userDB = SQLite.openDatabase('scheduleTransactions_UserInfo.db');

  await upgradeDB(userDB, upgradeJSON);

  let createBibleSchedule = new Promise((resolve, reject) => {
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
      () => {},
    );
  });

  await createBibleSchedule;
});

afterAll(() => {
  userDB.deleteDB();
});

test('deleteSchedule', async () => {
  await deleteSchedule(userDB, tableName, scheduleName);

  let table = await getSchedules();

  expect(table.length).toBe(0);
});

test('update read status to "Finished" and back to "Unfinished"', async () => {
  let scheduleInfo;

  let setAsRead = new Promise((res, rej) => {
    updateReadStatus(userDB, tableName, 1, true, res);
  });

  await setAsRead;
  scheduleInfo = await getScheduleInfo();
  expect(scheduleInfo.item(0).IsFinished).toBe(1);

  let setAsUnread = new Promise((res, rej) => {
    updateReadStatus(userDB, tableName, 1, false, res);
  });

  await setAsUnread;
  scheduleInfo = await getScheduleInfo();
  expect(scheduleInfo.item(0).IsFinished).toBe(0);
});

test('set Hide Completed true and then false', async () => {
  let tableInfo;
  await setHideCompleted(userDB, scheduleName, true);

  tableInfo = await getSchedules();

  expect(tableInfo.item(0).HideCompleted).toBe(1);

  await setHideCompleted(userDB, scheduleName, false);

  tableInfo = await getSchedules();

  expect(tableInfo.item(0).HideCompleted).toBe(0);
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

test('set a span of portions to "Read"', async () => {
  await updateMultipleReadStatus(userDB, tableName, 20);

  let scheduleInfo = await getScheduleInfo();

  expect(scheduleInfo.item(0).IsFinished).toBe(1);
  expect(scheduleInfo.item(10).IsFinished).toBe(1);
  expect(scheduleInfo.item(19).IsFinished).toBe(1);
  expect(scheduleInfo.item(20).IsFinished).toBe(0);
});

test('rename schedule', async () => {
  let newScheduleName = scheduleName + ' (NEW)';
  await renameSchedule(userDB, scheduleName, newScheduleName);

  let schedules = await getSchedules();

  expect(schedules.item(0).ScheduleName).toBe(newScheduleName);
});

test('find the closest corresponding index for a verse in a schedule table - simple', async () => {
  let index = await findCorrespondingIndex(userDB, tableName, 1, 1, 1);

  expect(index).toBe(0);
});

test('find the closest corresponding index for a verse in a schedule table - advanced', async () => {
  let index = await findCorrespondingIndex(userDB, tableName, 23, 39, 3);

  expect(index).toBe(216);
});
