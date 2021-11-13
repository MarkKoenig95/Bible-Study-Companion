import {log, runSQL} from './generalTransactions';
import {getWeekdays, ERROR, FREQS} from '../../logic/general';

const tblRemindersRows = `
    ID INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE
    Name VARCHAR(20) UNIQUE
    IsFinished BOOL
    Frequency TINYINT
    ResetValue TINYINT
    CompletionDate DATE
    `;

/**
 * Checks all reminders in the database and updates them if deemed appropriate, otherwise doesn't adjust them
 * @param {Database} userDB
 */
export async function updateReminderDates(userDB) {
  log('updating reminders');
  let reminders = await runSQL(userDB, 'SELECT * FROM tblReminders;');

  if (reminders.rows.length > 0) {
    for (let i = 0; i < reminders.rows.length; i++) {
      const reminder = reminders.rows.item(i);
      log('updating tblReminders reminder', i, reminder);
      if (reminder.IsFinished) {
        const {newCompDate, newIsFinished} = setReminderCompDate(
          reminder.CompletionDate,
          reminder.IsFinished,
          reminder.Frequency,
          reminder.ResetValue,
        );

        log('newCompDate', newCompDate, 'newIsFinished', newIsFinished);

        if (newCompDate) {
          await runSQL(
            userDB,
            'UPDATE tblReminders SET CompletionDate=?, IsFinished=? WHERE ID=?;',
            [newCompDate.toISOString(), newIsFinished ? 1 : 0, reminder.ID],
          );
        }
      }
    }
  }
}

/**
 * Given creation information adds a reminder to the database
 * @param {Database} userDB
 * @param {string} name
 * @param {Frequency} frequency
 * @param {number} resetValue
 * @param {Date} completionDate
 */
export async function addReminder(
  userDB,
  name,
  frequency,
  resetValue,
  completionDate,
) {
  let nameExists;

  //Check if the reminder already exists or not
  await runSQL(userDB, 'SELECT 1 FROM tblReminders WHERE Name=?;', [name]).then(
    (res) => {
      nameExists = res.rows.length > 0;
    },
  );

  if (nameExists) {
    console.warn('Reminder name taken');
    throw ERROR.NAME_TAKEN;
  }

  const SQL = `
    INSERT INTO tblReminders(
      Name,
      Frequency,
      ResetValue,
      CompletionDate) 
      VALUES 
      (?, ?, ?, ?);`;

  await runSQL(userDB, SQL, [
    name,
    frequency,
    resetValue,
    completionDate.toISOString(),
  ]).then(() => {
    log(name, 'reminder created successfully');
  });
}

export async function deleteReminder(userDB, id) {
  await runSQL(userDB, 'DELETE FROM tblReminders WHERE ID=?;', [id]);
}

/**
 * Given the previous values for a reminder returns new completion date and isFinished values
 * @param {Date} prevCompDate
 * @param {boolean} prevIsFinished
 * @param {Frequency} prevFrequency
 * @param {number} prevResetValue
 * @param {Frequency} frequency
 * @param {number} resetValue
 */
export function setReminderCompDate(
  prevCompDate,
  prevIsFinished,
  prevFrequency,
  prevResetValue,
  frequency,
  resetValue,
) {
  const compDate = new Date(prevCompDate);
  const newCompDate = new Date();
  newCompDate.setHours(0, 0, 0, 0);
  let newIsFinished = prevIsFinished;
  let shldSetCompDate = false;

  if (compDate.getTime() <= newCompDate.getTime()) {
    shldSetCompDate = true;
  }

  if (frequency && resetValue) {
    if (prevFrequency !== frequency || prevResetValue !== resetValue) {
      shldSetCompDate = true;
    }
  } else {
    frequency = prevFrequency;
    resetValue = prevResetValue;
  }

  if (shldSetCompDate) {
    switch (frequency) {
      case FREQS.DAILY:
        //Set the time to complete to be one milisecond before tomorrow
        newCompDate.setHours(23, 59, 59, 999);
        break;
      case FREQS.WEEKLY:
        let adjDays = getWeekdays().afterToday(resetValue);
        adjDays = adjDays === 0 ? 7 : adjDays;
        newCompDate.setDate(newCompDate.getDate() + adjDays);
        break;
      case FREQS.MONTHLY:
        if (resetValue <= newCompDate.getDate()) {
          /* Set the date to be just more than a month from the current date the function itself
            handles adjustments based on how many days the current month has, we just need to make
            sure that we end up within the next month */
          newCompDate.setDate(32);
        }
        newCompDate.setDate(resetValue);
        break;
      case FREQS.NEVER:
        break;
      default:
        break;
    }
    newIsFinished = false;
  } else {
    return {newCompDate: false, newIsFinished};
  }
  log(
    'finished setting new completion date',
    'compDate',
    compDate,
    'newCompDate',
    newCompDate,
    'newIsFinished',
    newIsFinished,
  );

  return {newIsFinished, newCompDate};
}
