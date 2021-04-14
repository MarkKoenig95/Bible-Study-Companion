import {ERROR} from '../../logic/general';

import {log, updateValue, runSQL} from './generalTransactions';

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

/**
 * Given information about the days of the week for a notification returns arrays of information to be used in adding this information to the database. (Ex. true is mapped to 1 and we return the string of the Date object)
 * @param {Array<boolean>} days Array length 7 of boolean elements indicating whether a notification should be made for a certain day of the week
 * @param {Array<Date>} times Array length 7 of Date objects indicating the time at which a notification should be triggered on a certain day of the week
 */
export function initValues(days, times) {
  let closest = {day: null, distance: null};
  let activeDays = [];
  let activeTimes = [];
  let nextDate = new Date();

  for (let i = 0; i < 7; i++) {
    let distanceFromToday = (i - nextDate.getDay() + 7) % 7; //Should probably replace with getWeekdays().afterToday() or something

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

/**
 * Given information for creating a notification will add the notification's info to the database and schedule the next notification if active
 * @param {Database} userDB
 * @param {*} notification
 * @param {string} notificationName
 * @param {Array<boolean>} days Array length 7 of boolean elements indicating whether a notification should be made for a certain day of the week
 * @param {Array<Date>} times Array length 7 of Date objects indicating the time at which a notification should be triggered on a certain day of the week
 * @param {boolean} isActive Is the notification in general active, if not, nothing will be triggered
 */
export async function addNotification(
  userDB,
  notification,
  notificationName,
  days,
  times,
  isActive = true,
) {
  log('adding notification');
  let nameExists;
  isActive = isActive ? 1 : 0;

  if (days.length < 7 || times.length < 7) {
    console.warn('Either your days or your times array is not long enough');
  }

  //Check if the notification already exists or not
  await runSQL(userDB, 'SELECT 1 FROM tblNotifications WHERE Name=?;', [
    notificationName,
  ]).then(res => {
    nameExists = res.rows.length > 0;
  });

  if (nameExists) {
    console.warn('Notification name taken');
    throw ERROR.NAME_TAKEN;
  }

  //If not, then process creating the notification with the given variables

  log('initializing notification values');
  const {activeDays, activeTimes, nextDate} = initValues(days, times);

  if (!nextDate) {
    return;
  }

  log('set next date to', nextDate);

  notification.scheduleNotif({
    date: nextDate,
  });

  const SQL = `
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

  await runSQL(userDB, SQL, [
    notificationName,
    nextDate.toString(),
    isActive,
    ...activeDays,
    ...activeTimes,
  ]).then(() => {
    log(notificationName, 'notification created successfully');
  });
}

export async function updateNotifications(userDB, notification) {
  log('updating notifications');
  const results = [];
  const now = new Date();
  await runSQL(
    userDB,
    'SELECT * FROM tblNotifications WHERE IsNotificationActive=1;',
  ).then(res => {
    for (let i = 0; i < res.rows.length; i++) {
      let item = res.rows.item(i);
      results.push(item);
    }
  });

  /*
    With the notifications from the table which are active check when the next notification
    will come up and set a scheduled notification for it, then update the date in the
    database accordingly for future reference
  */
  results.map(item => {
    let nextNotif = Date.parse(item.NextNotifDate);
    let notifIsSet;
    log(item);
    if (nextNotif < now.getTime()) {
      const {days, times} = getValueArraysFromItem(item);
      const {nextDate} = initValues(days, times);

      if (!nextDate) {
        return;
      }

      notification.getScheduledLocalNotifications(notifs => {
        notifs.forEach(notif => {
          if (notif.id == item.ID) {
            notifIsSet = true;
          }
        });

        if (!notifIsSet) {
          notification.scheduleNotif({
            id: item.ID,
            date: nextDate,
            title: item.Name,
          });

          updateValue(
            userDB,
            'tblNotifications',
            item.ID,
            'NextNotifDate',
            nextDate.toString(),
            () => {
              log('Updated notification', item.Name, 'to', nextDate);
            },
          );
        }
      });
    }
  });
  log('updating notifications finished');
}

export async function deleteNotification(db, id, notification) {
  await runSQL(db, 'DELETE FROM tblNotifications WHERE ID=?;', [id]);

  notification.cancelNotif(id);
}
