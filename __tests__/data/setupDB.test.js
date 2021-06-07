import SQLite from 'react-native-sqlite-storage';
import {appVersion, upgradeDB} from '../../data/Database/generalTransactions';
import {addReminder} from '../../data/Database/reminderTransactions';
import {
  addSchedule,
  updateMultipleReadStatus,
} from '../../data/Database/scheduleTransactions';
import upgradeJSON from '../../data/Database/upgrades/user-info-db-upgrade.json';
import {FREQS, SCHEDULE_TYPES} from '../../logic/general';

let userDB;
let bibleDB;

beforeAll(async () => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(new Date(2021, 2, 10, 0, 0, 0, 0)); // Wednesday, March 10th 2021 at midnight
  // There is a bug regarding this in jest. for now I use this solution If i ever have to erase my
  // node_modules folder and reinstall I want this link that I can reference back to
  // https://github.com/facebook/jest/issues/10221#issuecomment-654687396

  userDB = SQLite.openDatabase('e2e_UserInfo.db');
  userDB.deleteDB();
  bibleDB = SQLite.openDatabase('BibleStudyCompanion.db');
  userDB = SQLite.openDatabase('e2e_UserInfo.db');

  await upgradeDB(userDB, upgradeJSON);
  await appVersion(userDB);

  await addSchedule(
    userDB,
    bibleDB,
    SCHEDULE_TYPES.SEQUENTIAL,
    'Base Seq',
    true,
    [1, 1, 1, 1, 1, 1, 1],
    0.1,
    1,
    1,
    1,
    null,
    null,
    null,
    null,
    () => {},
    () => {},
  );

  await addSchedule(
    userDB,
    bibleDB,
    SCHEDULE_TYPES.CHRONOLOGICAL,
    'Base Chrono',
    true,
    [1, 1, 1, 1, 1, 1, 1],
    0.1,
    18,
    1,
    1,
    null,
    null,
    null,
    null,
    () => {},
    () => {},
  );

  await addSchedule(
    userDB,
    bibleDB,
    SCHEDULE_TYPES.THEMATIC,
    'Base Thema',
    true,
    [1, 1, 1, 1, 1, 1, 1],
    2,
    1,
    1,
    1,
    null,
    null,
    null,
    null,
    () => {},
    () => {},
  );

  // Mark all but the last reading portion complete in this table
  await updateMultipleReadStatus(userDB, 'tblSchedule3', 720);

  await addSchedule(
    userDB,
    bibleDB,
    SCHEDULE_TYPES.CUSTOM,
    'Base Cust',
    false,
    [1, 1, 1, 1, 1, 1, 1],
    null,
    null,
    null,
    null,
    1,
    1000,
    'Page',
    1,
    () => {},
    () => {},
  );

  await addReminder(userDB, 'Monthly Reminder', FREQS.MONTHLY, 1, new Date(0));
});

test('nothing', () => {
  expect(true).toBe(true);
});
