const {errorCB, log} = require('./generalTransactions');

const tblNotificationsColumns = {
  ID: 'ID',
  Name: 'Name',
  NextNotifDate: 'NextNotifDate',
  IsNotificationActive: 'IsNotificationActive',
  IsDay0Active: 'IsDay0Active',
  IsDay1Active: 'IsDay1Active',
  IsDay2Active: 'IsDay2Active',
  IsDay3Active: 'IsDay3Active',
  IsDay4Active: 'IsDay4Active',
  IsDay5Active: 'IsDay5Active',
  IsDay6Active: 'IsDay6Active',
  Day0Time: 'Day0Time',
  Day1Time: 'Day1Time',
  Day2Time: 'Day2Time',
  Day3Time: 'Day3Time',
  Day4Time: 'Day4Time',
  Day5Time: 'Day5Time',
  Day6Time: 'Day6Time',
};

export function initValues(days, times) {
  let closest = {day: null, distance: null};
  let activeDays = [];
  let activeTimes = [];
  let nextDate = new Date();

  for (let i = 0; i < 7; i++) {
    let distanceFromToday = (i - nextDate.getDay() + 7) % 7;

    if (closest.distance === null || distanceFromToday < closest.distance) {
      if (distanceFromToday !== 0) {
        if (days[i]) {
          closest.distance = distanceFromToday;
          closest.day = i;
        }
      } else {
        if (
          nextDate.getHours() < times[i].getHours() ||
          (nextDate.getHours() === times[i].getHours() &&
            nextDate.getMinutes() < times[i].getMinutes())
        ) {
          if (days[i]) {
            closest.distance = distanceFromToday;
            closest.day = i;
          }
        }
      }
    }

    activeDays.push(days[i] ? 1 : 0);
    activeTimes.push(times[i].toString());
  }

  if (closest.day !== null) {
    nextDate.setDate(nextDate.getDate() + closest.distance);
    nextDate.setHours(times[closest.day].getHours());
    nextDate.setMinutes(times[closest.day].getMinutes());
    nextDate.setSeconds(0);
  } else {
    nextDate = null;
  }

  return {activeDays, activeTimes, nextDate: nextDate};
}

export function getValueArraysFromItem(item) {
  let days = [];
  let times = [];

  for (let i = 0; i < 7; i++) {
    days.push(item[`IsDay${i}Active`]);
    times.push(new Date(item[`Day${i}Time`]));
  }

  return {days, times};
}

export async function addNotification(
  userDB,
  notification,
  notificationName,
  days,
  times,
  isActive = true,
) {
  let nameExists;
  isActive = isActive ? 1 : 0;

  if (days.length < 7 || times.length < 7) {
    console.warn('Either your days or your times array is not long enough');
  }

  //Check if the notification already exists or not
  await userDB
    .transaction(txn => {
      txn
        .executeSql(
          `SELECT 1 FROM tblNotifications WHERE Name="${notificationName}"`,
          [],
        )
        .then(([t, res]) => {
          nameExists = res.rows.length > 0;
          console.log(res.rows.length);
        });
    })
    .catch(errorCB);

  if (nameExists) {
    console.warn('Notification name taken');
    throw 'NAME_TAKEN';
  }

  //If not, then process creating the notification with the given variables

  const {activeDays, activeTimes, nextDate} = initValues(days, times);

  if (!nextDate) {
    return;
  }

  log('set next date to', nextDate);

  notification.scheduleNotif({
    date: nextDate,
  });

  `
    INSERT INTO tblNotifications(
      Name,
      NextNotifDate,
      IsNotificationActive,
      IsDay0Active,
      IsDay1Active,
      IsDay2Active,
      IsDay3Active,
      IsDay4Active,
      IsDay5Active,
      IsDay6Active,
      Day0Time,
      Day1Time,
      Day2Time,
      Day3Time,
      Day4Time,
      Day5Time,
      Day6Time) 
      VALUES 
      (?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, ?, ?);
    `;

  await userDB.transaction(txn => {
    txn
      .executeSql(SQL, [
        notificationName,
        nextDate.toString(),
        isActive,
        ...activeDays,
        ...activeTimes,
      ])
      .then(() => {
        log(notificationName, 'created successfully');
      });
  });
}

export async function updateNotification(
  userDB,
  notificationID,
  column,
  value,
  afterUpdate,
) {
  await userDB
    .transaction(txn => {
      let sql = `UPDATE tblNotifications
                    SET ${column}=?
                    WHERE ID=?;`;
      txn.executeSql(sql, [value, notificationID]).then(afterUpdate());
    })
    .catch(errorCB);
}

async function checkNextNotificationDate(userDB, notificationID) {
  let nextNotifDate;
  await userDB
    .transaction(txn => {
      txn
        .executeSql(`SELECT NextNotifDate FROM tblNotifications WHERE ID=?`, [
          notificationID,
        ])
        .then(([t, res]) => {
          nextNotifDate = Date.parse(res.rows.item(0).NextNotifDate);
        });
    })
    .catch(err => {
      errorCB(err);
    });

  return nextNotifDate;
}
