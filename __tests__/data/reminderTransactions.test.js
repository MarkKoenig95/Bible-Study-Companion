import SQLite from 'react-native-sqlite-storage';
import {runSQL, upgradeDB} from '../../data/Database/generalTransactions';
import {
  addReminder,
  deleteReminder,
  setReminderCompDate,
  updateReminderDates,
} from '../../data/Database/reminderTransactions';
import upgradeJSON from '../../data/Database/upgrades/user-info-db-upgrade.json';
import {FREQS} from '../../logic/general';

let userDB;

const dailyName = 'daily';
const weeklyName = 'weekly';
const monthlyName = 'monthly';

async function getTblReminders() {
  return await runSQL(userDB, 'SELECT * FROM tblReminders');
}

beforeAll(async () => {
  userDB = SQLite.openDatabase('reminderTransactions_UserInfo.db');

  await upgradeDB(userDB, upgradeJSON);
});

afterAll(() => {
  userDB.deleteDB();
});

describe('setReminderCompDate', () => {
  /*
    Tests:
    For frequencies DAILY, WEEKLY, MONTHLY or NEVER
        same frequency
        prevCompDate Passed / Not
        isFinished true / false
            Check each permutation of these results

        changed frequency
            Check one of these for each frequency and make sure that they are the correct result

    WEEKLY, MONTHLY
        change reset value
    */

  beforeAll(() => {
    jest.useFakeTimers('modern');

    jest.setSystemTime(new Date(2021, 2, 7, 0, 0, 0, 0).getTime()); // March 7th 2021 at midnight
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  // Tests DAILY, same frequency, prevCompDate Passed, isFinished true
  test('For DAILY frequency Given the previous comp DATE IS PASSED and the reminder IS FINISHED returns false for is finished and the last millisecond of the current day as the new completion date', () => {
    let resultDate = new Date();
    let prevDate = new Date();
    resultDate.setHours(23, 59, 59, 999);
    prevDate.setDate(resultDate.getDate() - 1); // March 6th 2021

    let result = setReminderCompDate(
      prevDate,
      true,
      FREQS.DAILY,
      10,
      FREQS.DAILY,
      10,
    );
    expect(result.newIsFinished).toBe(false);
    expect(result.newCompDate).toStrictEqual(resultDate);
  });

  // Tests DAILY, same frequency, prevCompDate Passed, isFinished false
  test('For DAILY frequency Given the previous comp DATE IS PASSED and the reminder IS NOT FINISHED returns false for is finished and the last millisecond of the current day as the new completion date', () => {
    let resultDate = new Date();
    let prevDate = new Date();
    resultDate.setHours(23, 59, 59, 999);
    prevDate.setDate(resultDate.getDate() - 1); // March 6th 2021

    let result = setReminderCompDate(
      prevDate,
      false,
      FREQS.DAILY,
      10,
      FREQS.DAILY,
      10,
    );
    expect(result.newIsFinished).toBe(false);
    expect(result.newCompDate).toStrictEqual(resultDate);
  });

  // Tests DAILY, same frequency, prevCompDate Not Passed, isFinished true
  test('For DAILY frequency Given the previous comp date has not passed and the reminder IS FINISHED returns true for is finished and no completion date', () => {
    let newDate = new Date();
    newDate.setDate(newDate.getDate() + 1); // March 8th 2021

    let result = setReminderCompDate(
      newDate,
      true,
      FREQS.DAILY,
      10,
      FREQS.DAILY,
      10,
    );
    expect(result.newIsFinished).toBe(true);
    expect(result.newCompDate).toBe(false);
  });

  // Tests DAILY, same frequency, prevCompDate Not Passed, isFinished false
  test('For DAILY frequency Given the previous comp date has not passed and the reminder IS NOT FINISHED returns false for is finished and no completion date', () => {
    let newDate = new Date();
    newDate.setDate(newDate.getDate() + 1); // March 8th 2021

    let result = setReminderCompDate(
      newDate,
      false,
      FREQS.DAILY,
      10,
      FREQS.DAILY,
      10,
    );
    expect(result.newIsFinished).toBe(false);
    expect(result.newCompDate).toBe(false);
  });

  // Tests DAILY, changed frequency to WEEKLY
  test('For DAILY frequency Given the NEW FREQUENCY is WEEKLY and the NEW RESET VALUE is 2 returns false for is finished and the next tuesday as the completion date', () => {
    let resultDate = new Date();
    let prevDate = new Date();
    resultDate.setDate(resultDate.getDate() + 3); // March 10th 2021 (Wednesday)

    let result = setReminderCompDate(
      prevDate,
      true,
      FREQS.DAILY,
      3,
      FREQS.WEEKLY,
      3,
    );
    expect(result.newIsFinished).toBe(false);
    expect(result.newCompDate).toStrictEqual(resultDate);
  });

  // Tests WEEKLY, same frequency, prevCompDate Passed, isFinished true
  test('For WEEKLY frequency Given the previous comp DATE IS PASSED and the reminder IS FINISHED returns false for is finished and the new completion date', () => {
    let resultDate = new Date();
    let prevDate = new Date();
    resultDate.setDate(resultDate.getDate() + 4); // March 11th 2021 (Thursday)
    prevDate.setDate(prevDate.getDate() - 1); // March 6th 2021

    let result = setReminderCompDate(
      prevDate,
      true,
      FREQS.WEEKLY,
      4,
      FREQS.WEEKLY,
      4,
    );
    expect(result.newIsFinished).toBe(false);
    expect(result.newCompDate).toStrictEqual(resultDate);
  });

  // Tests WEEKLY, same frequency, prevCompDate Passed, isFinished false
  test('For WEEKLY frequency Given the previous comp DATE IS PASSED and the reminder IS NOT FINISHED returns false for is finished and the new completion date', () => {
    let resultDate = new Date();
    let prevDate = new Date();
    resultDate.setDate(resultDate.getDate() + 1); // March 8th 2021 (Monday)
    prevDate.setDate(resultDate.getDate() - 1); // March 6th 2021

    let result = setReminderCompDate(
      prevDate,
      false,
      FREQS.WEEKLY,
      1,
      FREQS.WEEKLY,
      1,
    );
    expect(result.newIsFinished).toBe(false);
    expect(result.newCompDate).toStrictEqual(resultDate);
  });

  // Tests WEEKLY, same frequency, prevCompDate Not Passed, isFinished true
  test('For WEEKLY frequency Given the previous comp date has not passed and the reminder IS FINISHED returns true for is finished and no completion date', () => {
    let newDate = new Date();
    newDate.setDate(newDate.getDate() + 1); // March 8th 2021 (Monday)

    let result = setReminderCompDate(
      newDate,
      true,
      FREQS.WEEKLY,
      0,
      FREQS.WEEKLY,
      0,
    );
    expect(result.newIsFinished).toBe(true);
    expect(result.newCompDate).toBe(false);
  });

  // Tests WEEKLY, same frequency, prevCompDate Not Passed, isFinished false
  test('For WEEKLY frequency Given the previous comp date has not passed and the reminder IS NOT FINISHED returns false for is finished and no completion date', () => {
    let newDate = new Date();
    newDate.setDate(newDate.getDate() + 1); // March 8th 2021

    let result = setReminderCompDate(
      newDate,
      false,
      FREQS.WEEKLY,
      0,
      FREQS.WEEKLY,
      0,
    );
    expect(result.newIsFinished).toBe(false);
    expect(result.newCompDate).toBe(false);
  });

  // Tests WEEKLY, changed frequency to MONTHLY
  test('For WEEKLY frequency Given the NEW FREQUENCY is MONTHLY and the RESET VALUE is 6 returns false for is finished and the completion date', () => {
    let resultDate = new Date();
    let prevDate = new Date();
    resultDate.setDate(resultDate.getDate() + 30); // March 12th 2021 (Saturday)

    let result = setReminderCompDate(
      prevDate,
      true,
      FREQS.WEEKLY,
      6,
      FREQS.MONTHLY,
      6,
    );
    expect(result.newIsFinished).toBe(false);
    expect(result.newCompDate).toStrictEqual(resultDate);
  });

  // Tests WEEKLY, changed reset day, same frequency, same comp date,
  test('For WEEKLY frequency Given the NEW RESET VALUE is 6 returns false for is finished and the completion date', () => {
    let resultDate = new Date();
    let prevDate = new Date();
    resultDate.setDate(resultDate.getDate() + 6); // March 12th 2021 (Saturday)

    let result = setReminderCompDate(
      prevDate,
      false,
      FREQS.WEEKLY,
      4,
      FREQS.WEEKLY,
      6,
    );
    expect(result.newIsFinished).toBe(false);
    expect(result.newCompDate).toStrictEqual(resultDate);
  });

  // Tests MONTHLY, same frequency, prevCompDate Passed, isFinished true
  test('For MONTHLY frequency Given the previous comp DATE IS PASSED and the reminder IS FINISHED returns false for is finished and the new completion date', () => {
    let resultDate = new Date();
    let prevDate = new Date();
    resultDate.setDate(resultDate.getDate() + 25); // April 1st 2021
    prevDate.setDate(prevDate.getDate() - 6); // March 1sh 2021

    let result = setReminderCompDate(
      prevDate,
      true,
      FREQS.MONTHLY,
      1,
      FREQS.MONTHLY,
      1,
    );
    expect(result.newIsFinished).toBe(false);
    expect(result.newCompDate).toStrictEqual(resultDate);
  });

  // Tests MONTHLY, same frequency, prevCompDate Passed, isFinished false
  test('For MONTHLY frequency Given the previous comp DATE IS PASSED and the reminder IS NOT FINISHED returns false for is finished and the new completion date', () => {
    let resultDate = new Date();
    let prevDate = new Date();
    resultDate.setDate(resultDate.getDate() + 25); // April 1st 2021
    prevDate.setDate(prevDate.getDate() - 6); // March 1sh 2021

    let result = setReminderCompDate(
      prevDate,
      false,
      FREQS.MONTHLY,
      1,
      FREQS.MONTHLY,
      1,
    );
    expect(result.newIsFinished).toBe(false);
    expect(result.newCompDate).toStrictEqual(resultDate);
  });

  // Tests MONTHLY, same frequency, prevCompDate Not Passed, isFinished true
  test('For MONTHLY frequency Given the previous comp DATE IS NOT PASSED and the reminder IS FINISHED returns false for is finished and no completion date', () => {
    let resultDate = new Date();
    resultDate.setDate(resultDate.getDate() + 25); // April 1st 2021

    let result = setReminderCompDate(
      resultDate,
      true,
      FREQS.MONTHLY,
      1,
      FREQS.MONTHLY,
      1,
    );
    expect(result.newIsFinished).toBe(true);
    expect(result.newCompDate).toBe(false);
  });

  // Tests MONTHLY, same frequency, prevCompDate Not Passed, isFinished false
  test('For MONTHLY frequency Given the previous comp DATE IS NOT PASSED and the reminder IS NOT FINISHED returns false for is finished and no completion date', () => {
    let resultDate = new Date();
    resultDate.setDate(resultDate.getDate() + 25); // April 1st 2021

    let result = setReminderCompDate(
      resultDate,
      false,
      FREQS.MONTHLY,
      1,
      FREQS.MONTHLY,
      1,
    );
    expect(result.newIsFinished).toBe(false);
    expect(result.newCompDate).toBe(false);
  });

  // Tests MONTHLY, changed frequency to NEVER
  test('For MONTHLY frequency Given the NEW FREQUENCY is NEVER and the RESET VALUE is 1 returns false for is finished and the completion date', () => {
    let resultDate = new Date();
    let prevDate = new Date();
    resultDate.setHours(0, 0, 0, 0); // Today at midnight
    prevDate.setDate(prevDate.getDate() - 6); // March 1sh 2021

    let result = setReminderCompDate(
      prevDate,
      true,
      FREQS.MONTHLY,
      1,
      FREQS.NEVER,
      1,
    );
    expect(result.newIsFinished).toBe(false);
    expect(result.newCompDate).toStrictEqual(resultDate);
  });

  // Tests MONTHLY, changed reset day, same frequency, same comp date
  test('For MONTHLY frequency Given the NEW RESET VALUE is 1 the PREV RESET VALUE is 31 returns false for is finished and the completion date', () => {
    jest.setSystemTime(new Date(2021, 0, 31, 0, 0, 0, 0).getTime());

    let resultDate = new Date();
    let prevDate = new Date();
    resultDate.setDate(resultDate.getDate() + 1); // February 1st 2021

    let result = setReminderCompDate(
      prevDate,
      true,
      FREQS.MONTHLY,
      31,
      FREQS.MONTHLY,
      1,
    );
    expect(result.newIsFinished).toBe(false);
    expect(result.newCompDate).toStrictEqual(resultDate);
  });
});

describe('addReminder', () => {
  let baseDate = new Date(0);
  test('DAILY frequency', async () => {
    await addReminder(userDB, dailyName, FREQS.DAILY, 1, baseDate);

    let reminder;
    await runSQL(
      userDB,
      'SELECT * FROM tblReminders WHERE Name=?',
      dailyName,
    ).then(res => {
      reminder = res.rows.item(0);
    });

    expect(reminder.ResetValue).toBe(1);
    expect(reminder.Name).toBe(dailyName);
    expect(reminder.Frequency).toBe(FREQS.DAILY);
    expect(reminder.CompletionDate).toBe(baseDate.toString());
  });

  test('WEEKLY frequency', async () => {
    await addReminder(userDB, weeklyName, FREQS.WEEKLY, 2, baseDate);

    let reminder;
    await runSQL(
      userDB,
      'SELECT * FROM tblReminders WHERE Name=?',
      weeklyName,
    ).then(res => {
      reminder = res.rows.item(0);
    });

    expect(reminder.ResetValue).toBe(2);
    expect(reminder.Name).toBe(weeklyName);
    expect(reminder.Frequency).toBe(FREQS.WEEKLY);
    expect(reminder.CompletionDate).toBe(baseDate.toString());
  });

  test('MONTHLY frequency', async () => {
    await addReminder(userDB, monthlyName, FREQS.MONTHLY, 31, baseDate);

    let reminder;
    await runSQL(
      userDB,
      'SELECT * FROM tblReminders WHERE Name=?',
      monthlyName,
    ).then(res => {
      reminder = res.rows.item(0);
    });

    expect(reminder.ResetValue).toBe(31);
    expect(reminder.Name).toBe(monthlyName);
    expect(reminder.Frequency).toBe(FREQS.MONTHLY);
    expect(reminder.CompletionDate).toBe(baseDate.toString());
  });
});

test('updateReminderDates', async () => {
  //Update all of the reminders to be completed. Then they will actually be updated by our test.
  for (let i = 1; i < 7; i++) {
    await runSQL(userDB, 'UPDATE tblReminders SET IsFinished=1 WHERE ID=?', [
      i,
    ]);
  }

  await updateReminderDates(userDB);

  let tblReminders = await getTblReminders();

  const today = new Date();
  const dailyText = tblReminders.rows.item(0);
  const midweekMeeting = tblReminders.rows.item(1);
  const weekendMeeting = tblReminders.rows.item(2);
  const dailyOther = tblReminders.rows.item(3);
  const weeklyOther = tblReminders.rows.item(4);
  const monthlyOther = tblReminders.rows.item(5);

  //---------------------- dailyText ----------------------
  let completionDate1 = new Date(dailyText.CompletionDate);

  expect(dailyText.IsFinished).toBe(0);
  expect(dailyText.Frequency).toBe(FREQS.DAILY);
  expect(dailyText.Name).toBe('Daily Text');
  expect(completionDate1.getDate()).toBe(today.getDate());

  //----------------------- midweekMeeting -----------------------
  let completionDate2 = new Date(midweekMeeting.CompletionDate);

  expect(midweekMeeting.IsFinished).toBe(0);
  expect(midweekMeeting.Frequency).toBe(FREQS.WEEKLY);
  expect(midweekMeeting.Name).toBe('Midweek Meeting Study');
  expect(completionDate2.getDay()).toBe(midweekMeeting.ResetValue);

  //----------------------- weekendMeeting -----------------------
  let completionDate3 = new Date(weekendMeeting.CompletionDate);

  expect(weekendMeeting.IsFinished).toBe(0);
  expect(weekendMeeting.Frequency).toBe(FREQS.WEEKLY);
  expect(weekendMeeting.Name).toBe('Weekend Meeting Study');
  expect(completionDate3.getDay()).toBe(weekendMeeting.ResetValue);

  //---------------------- dailyOther ----------------------
  let completionDate4 = new Date(dailyOther.CompletionDate);

  expect(dailyOther.IsFinished).toBe(0);
  expect(dailyOther.Frequency).toBe(FREQS.DAILY);
  expect(dailyOther.Name).toBe(dailyName);
  expect(completionDate4.getDate()).toBe(today.getDate());

  //----------------------- weeklyOther -----------------------
  let completionDate5 = new Date(weeklyOther.CompletionDate);

  expect(weeklyOther.IsFinished).toBe(0);
  expect(weeklyOther.Frequency).toBe(FREQS.WEEKLY);
  expect(weeklyOther.Name).toBe(weeklyName);
  expect(completionDate5.getDay()).toBe(weeklyOther.ResetValue);

  //----------------------- monthlyOther -----------------------
  let completionDate6 = new Date(monthlyOther.CompletionDate);

  expect(monthlyOther.IsFinished).toBe(0);
  expect(monthlyOther.Frequency).toBe(FREQS.MONTHLY);
  expect(monthlyOther.Name).toBe(monthlyName);
  expect(completionDate6.getDate()).toBe(monthlyOther.ResetValue);
});

test('deleteReminder', async () => {
  let initialLength;

  await getTblReminders().then(res => {
    initialLength = res.rows.length;
  });

  await deleteReminder(userDB, 1);

  let finalLength;

  await getTblReminders().then(res => {
    finalLength = res.rows.length;
  });

  expect(finalLength).toBe(initialLength - 1);
});
