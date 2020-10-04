import {errorCB, log} from './generalTransactions';
import {getWeekdaysAfterToday, ERROR} from '../../logic/logic';

export const FREQS = {
  DAILY: 0,
  WEEKLY: 1,
  MONTHLY: 2,
  NEVER: 3,
};

const tblRemindersRows = `
    ID INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE
    Name VARCHAR(20) UNIQUE
    IsFinished BOOL
    Frequency TINYINT
    ResetValue TINYINT
    CompletionDate DATE
    `;

export async function updateReminderDates(userDB) {
  log('updating reminders');
  let reminders = [];

  await userDB
    .transaction(txn => {
      txn.executeSql('SELECT * FROM tblReminders', []).then(([t, res]) => {
        reminders = res.rows;
      });
    })
    .catch(errorCB);

  if (reminders.length > 0) {
    for (let i = 0; i < reminders.length; i++) {
      const reminder = reminders.item(i);
      log('updating tblReminders reminder', i, reminder);
      const {newCompDate, newIsFinished} = setReminderCompDate(
        reminder.CompletionDate,
        reminder.IsFinished,
        reminder.Frequency,
        reminder.ResetValue,
      );

      log('newCompDate', newCompDate, 'newIsFinished', newIsFinished);

      if (newCompDate) {
        await userDB
          .transaction(txn => {
            txn.executeSql(
              'UPDATE tblReminders SET CompletionDate=?, IsFinished=? WHERE ID=?;',
              [newCompDate.toString(), newIsFinished ? 1 : 0, reminder.ID],
            );
          })
          .catch(errorCB);
      }
    }
  }
}

export async function addReminder(
  userDB,
  name,
  frequency,
  resetValue,
  completionDate,
) {
  let nameExists;

  //Check if the reminder already exists or not
  await userDB
    .transaction(txn => {
      txn
        .executeSql('SELECT 1 FROM tblReminders WHERE Name=?', [name])
        .then(([t, res]) => {
          nameExists = res.rows.length > 0;
        });
    })
    .catch(errorCB);

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

  await userDB
    .transaction(txn => {
      txn
        .executeSql(SQL, [
          name,
          frequency,
          resetValue,
          completionDate.toString(),
        ])
        .then(() => {
          log(name, 'reminder created successfully');
        });
    })
    .catch(errorCB);
}

export async function deleteReminder(userDB, id) {
  userDB
    .transaction(txn => {
      txn.executeSql('DELETE FROM tblReminders WHERE ID=?', [id]);
    })
    .catch(errorCB);
}

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
  newCompDate.setHours(0);
  newCompDate.setMinutes(0);
  newCompDate.setSeconds(0);
  let newIsFinished = prevIsFinished;
  let shldSetCompDate = false;

  if (compDate.getTime() < newCompDate.getTime()) {
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
        newCompDate.setDate(newCompDate.getDate() + 1);
        break;
      case FREQS.WEEKLY:
        let adjDays = getWeekdaysAfterToday(resetValue);
        adjDays = adjDays === 0 ? 7 : adjDays;
        newCompDate.setDate(newCompDate.getDate() + adjDays);

        console.log(
          'resetValue',
          resetValue,
          'getWeekdaysAfterToday(resetValue)',
          getWeekdaysAfterToday(resetValue),
        );
        break;
      case FREQS.MONTHLY:
        if (resetValue <= newCompDate.getDate()) {
          newCompDate.setDate(32);
        }
        newCompDate.setDate(resetValue);
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
