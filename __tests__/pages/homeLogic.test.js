import {
  populateHomeList,
  populateReminders,
  populateScheduleButtons,
  populateWeeklyReading,
} from '../../pages/Home';
import SQLite from 'react-native-sqlite-storage';
import upgradeJSON from '../../data/Database/upgrades/user-info-db-upgrade.json';
import {upgradeDB} from '../../data/Database/generalTransactions';
import {addSchedule} from '../../data/Database/scheduleTransactions';
import {addReminder} from '../../data/Database/reminderTransactions';
import {FREQS, SCHEDULE_TYPES, VERSE_POSITION} from '../../logic/general';

let userDB;
let bibleDB;
const scheduleName = 'custom';

async function setupDatabase() {
  // Create schedules and reminders such that there will be an item for each section of the homepage
  // upgradeDB will create some weekly and daily reminders, we will manually make a monthly reminder
  // and an untracked schedule for the other section

  await upgradeDB(userDB, upgradeJSON);

  await addReminder(userDB, 'monthly', FREQS.MONTHLY, 1, new Date(0));

  await addSchedule(
    userDB,
    bibleDB,
    SCHEDULE_TYPES.CUSTOM,
    scheduleName,
    false,
    [1, 1, 1, 1, 1, 1, 1],
    0,
    0,
    0,
    0,
    1,
    10,
    'Portion',
    1,
    jest.fn,
    jest.fn,
  );
}

beforeAll(async () => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(new Date(2021, 2, 10, 0, 0, 0, 0)); // Wednesday, March 10th 2021 at midnight
  // There is a bug regarding this in jest. for now I use this solution If i ever have to erase my
  // node_modules folder and reinstall I want this link that I can reference back to
  // https://github.com/facebook/jest/issues/10221#issuecomment-654687396

  userDB = SQLite.openDatabase('homeLogic_UserInfo.db');
  bibleDB = SQLite.openDatabase('BibleStudyCompanion.db');

  await setupDatabase();
});

afterAll(() => {
  userDB.deleteDB();
});

test('populateReminders', async () => {
  let result = await populateReminders(
    userDB,
    FREQS.DAILY,
    jest.fn,
    jest.fn,
    1,
  );

  let item = result[0];

  expect(item.isFinished).toBe(false);
  expect(item.completionDate).toEqual(new Date('1970-01-01T00:00:00.000Z'));
  expect(item.completedHidden).toBe(true);
  expect(typeof item.onLongPress).toBe('function');
  expect(typeof item.onPress).toBe('function');
  expect(item.readingPortion).toBe('Daily Text');
  expect(item.title).toBe('Reminder');
  expect(item.update).toBe(1);
});

test('populateScheduleButtons', async () => {
  let result = await populateScheduleButtons(userDB, true, false, 1);

  let item = result[0][0];

  expect(item.ID).toBe(1);
  expect(item.readingPortion).toBe('Portion 1');
  expect(item.isFinished).toBe(false);
  expect(item.title).toBe(scheduleName);
  expect(item.doesTrack).toBe(false);
  expect(item.tableName).toBe('tblSchedule1');
  expect(item.update).toBe(1);
});

test('populateWeeklyReading', async () => {
  let result = await populateWeeklyReading(userDB, bibleDB, 4, 1);

  let item = result[0][0];

  console.log(item);
  expect(result[0].length).toBe(7);
  expect(item.ID).toBe(1);
  expect(item.startBookName).toBe('Numbers');
  expect(item.startBookNumber).toBe(4);
  expect(item.startChapter).toBe(5);
  expect(item.startVerse).toBe(1);
  expect(item.endBookName).toBe('Numbers');
  expect(item.endBookNumber).toBe(4);
  expect(item.endChapter).toBe(5);
  expect(item.endVerse).toBe(9);
  expect(item.versePosition).toBe(VERSE_POSITION.START);
  expect(item.completionDate).toEqual(new Date('2021-03-04T06:00:00.000Z'));
  expect(item.readingPortion).toBe('Numbers 5:1-9');
  expect(item.isFinished).toBe(false);
  expect(item.title).toBe('Weekly Reading');
  expect(item.tableName).toBe('tblWeeklyReading');
  expect(item.update).toBe(1);

  let finalItem = result[0][6];

  expect(finalItem.ID).toBe(7);
  expect(finalItem.completionDate).toEqual(
    new Date('2021-03-10T06:00:00.000Z'),
  );
  expect(finalItem.readingPortion).toBe('Numbers 6:24-27');
});

test('populateHomeList', async () => {
  let a = [
    {title: 'Today', data: [[Array], [Array]]},
    {title: 'This Week', data: [[Array], [Array], [Array]]},
    {title: 'This Month', data: [[Array]]},
    {title: 'Other', data: [[Array]]},
  ];
  let result = await populateHomeList(
    userDB,
    bibleDB,
    4,
    true,
    jest.fn,
    jest.fn,
    1,
  );

  let today = result[0];
  let thisWeek = result[1];
  let thisMonth = result[2];
  let other = result[3];

  //---------------- Today ----------------
  expect(today.title).toBe('Today');
  expect(today.data.length).toBe(2);

  //-------------- This Week --------------
  expect(thisWeek.title).toBe('This Week');
  expect(thisWeek.data.length).toBe(3);

  //------------- This Month ---------------
  expect(thisMonth.title).toBe('This Month');
  expect(thisMonth.data.length).toBe(1);

  //---------------- Other ----------------
  expect(other.title).toBe('Other');
  expect(other.data.length).toBe(1);
});

// test('',()=>{
// })
