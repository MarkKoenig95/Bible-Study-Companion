import SQLite from 'react-native-sqlite-storage';
import {runSQL, upgradeDB} from '../../data/Database/generalTransactions';
import {
  addNotification,
  deleteNotification,
  getValueArraysFromItem,
  initValues,
  updateNotifications,
} from '../../data/Database/notificationTransactions';
import {notification} from '../../logic/notifications/NotifService';
import upgradeJSON from '../../data/Database/upgrades/user-info-db-upgrade.json';

let baseArray = [null, null, null, null, null, null, null];
const notificationName = 'notification';
let notificationID;
let userDB;

// There is a bug regarding this in jest. for now I use this solution If i ever have to erase my
// node_modules folder and reinstall I want this link that I can reference back to
// https://github.com/facebook/jest/issues/10221#issuecomment-654687396

beforeAll(async () => {
  userDB = SQLite.openDatabase('UserInfo.db');

  await upgradeDB(userDB, upgradeJSON);
});

beforeEach(() => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(new Date(2021, 2, 7, 9, 0, 0, 0).getTime()); // Sunday, March 7th 2021 at 9:00am
});

afterAll(() => {
  jest.useRealTimers();
  userDB.deleteDB();
});

async function getNotification() {
  let notif;

  await runSQL(userDB, 'SELECT * FROM tblNotifications WHERE Name=?', [
    notificationName,
  ]).then(res => {
    notif = res.rows.item(0);
  });

  return notif;
}

describe('initValues', () => {
  test('Everything active', () => {
    let time = new Date(); // Sunday, March 7th 2021 at 9:00am
    time.setHours(8);
    const times = baseArray.map(item => time);
    const days = baseArray.map(item => true);

    let {activeDays, activeTimes, nextDate} = initValues(days, times);
    let tempDate = new Date(time); // Sunday, March 7th 2021 at 8:00am
    tempDate.setDate(8);

    expect(nextDate).toStrictEqual(tempDate);

    for (let i = 0; i < 7; i++) {
      expect(activeDays[i]).toBe(1);
      expect(activeTimes[i]).toBe(time.toString());
    }
  });

  test('Only farthest date from today active', () => {
    let time = new Date();
    time.setHours(8);
    const times = baseArray.map(item => time);
    const days = [...baseArray];

    days[6] = true;

    let {activeDays, activeTimes, nextDate} = initValues(days, times);
    let tempDate = new Date(time);
    tempDate.setDate(13); // Saturday, March 13th 2021 at 8:00am

    expect(nextDate).toStrictEqual(tempDate);
    expect(activeDays[6]).toBe(1);
    expect(activeTimes[6]).toBe(time.toString());

    for (let i = 0; i < 6; i++) {
      expect(activeDays[i]).toBe(0);
      expect(activeTimes[i]).toBe(time.toString());
    }
  });
});

test('addNotification', async () => {
  let time = new Date(); // Sunday, March 7th 2021 at 9:00am
  time.setHours(8);
  const times = baseArray.map(() => time);
  const days = baseArray.map(() => true);

  await addNotification(
    userDB,
    notification,
    notificationName,
    days,
    times,
    true,
  );

  const notif = await getNotification();
  notificationID = notif.ID;

  //--------------------- Checks ---------------------
  for (let i = 0; i < 6; i++) {
    expect(notif[`IsDay${i}Active`]).toBe(1);
    expect(notif[`Day${i}Time`]).toBe(time.toString());
  }

  expect(notif.Name).toBe(notificationName);
  expect(notif.IsNotificationActive).toBe(1);

  time.setDate(8);
  expect(notif.NextNotifDate).toBe(time.toString());
});

test('getValueArraysFromItem', () => {
  jest.setSystemTime(new Date(2021, 2, 9, 8, 0, 0, 0).getTime()); // Sunday, March 9th 2021 at 8:00am
  let time = new Date();

  let expectedDays = baseArray.map(() => 1);
  let expectedTimes = baseArray.map(() => time);

  let item = {
    ID: 4,
    Name: 'notification',
    NextNotifDate: 'Wed Mar 10 2021 08:00:00 GMT+0800 (China Standard Time)',
    IsNotificationActive: 1,
    IsDay0Active: 1,
    IsDay1Active: 1,
    IsDay2Active: 1,
    IsDay3Active: 1,
    IsDay4Active: 1,
    IsDay5Active: 1,
    IsDay6Active: 1,
    Day0Time: 'Tue Mar 09 2021 08:00:00 GMT+0800 (China Standard Time)',
    Day1Time: 'Tue Mar 09 2021 08:00:00 GMT+0800 (China Standard Time)',
    Day2Time: 'Tue Mar 09 2021 08:00:00 GMT+0800 (China Standard Time)',
    Day3Time: 'Tue Mar 09 2021 08:00:00 GMT+0800 (China Standard Time)',
    Day4Time: 'Tue Mar 09 2021 08:00:00 GMT+0800 (China Standard Time)',
    Day5Time: 'Tue Mar 09 2021 08:00:00 GMT+0800 (China Standard Time)',
    Day6Time: 'Tue Mar 09 2021 08:00:00 GMT+0800 (China Standard Time)',
  };

  let {days, times} = getValueArraysFromItem(item);

  expect(days).toStrictEqual(expectedDays);
  expect(times).toStrictEqual(expectedTimes);
});

test('updateNotifications', async () => {
  jest.setSystemTime(new Date(2021, 2, 9, 9, 0, 0, 0).getTime()); // Sunday, March 9th 2021 at 9:00am
  let time = new Date();
  time.setDate(10);
  time.setHours(8);

  await updateNotifications(userDB, notification);

  const notif = await getNotification();

  expect(notif.NextNotifDate).toBe(time.toString());
});

test('deleteNotification', async () => {
  await deleteNotification(userDB, notificationID, notification);

  const notif = await getNotification();

  expect(notif).toBe(undefined);
});
