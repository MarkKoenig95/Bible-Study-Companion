const shouldLog = false;
import SQLite from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';
import {LocalDBPath} from '../fileSystem';
import {translate} from '../../logic/localization/localization';
import {FREQS} from '../../logic/logic';
import {version} from '../../package.json';

SQLite.enablePromise(true);

/**
 * @typedef Database
 * @property {Function} executeSql
 */

export function log() {
  if (shouldLog) {
    console.log(...arguments);
  }
}

export function errorCB(err) {
  console.warn('SQL Error: ' + err.message);
}

export async function updateValue(
  DB,
  tableName,
  id,
  column,
  value,
  afterUpdate = () => {},
) {
  await runSQL(
    DB,
    `UPDATE ${tableName}
       SET ${column}=?
       WHERE ID=?;`,
    [value, id],
  ).then(afterUpdate);
}

export function createPlaceholdersFromArray(array) {
  let values = [];
  const thisFunc = innerArray => {
    let innerString = innerArray.map(() => '?').join(',');

    let result = `( ${innerString} )`;
    return result;
  };

  let placeholders;

  if (Array.isArray(array[0])) {
    placeholders = array.map(thisFunc).join(',');
    array.map(innerArray => {
      innerArray.map(value => values.push(value));
    });
  } else {
    thisFunc(array);
    values = [...array];
  }

  return {placeholders, values};
}

export function timeKeeper(message) {
  let time = new Date();
  let milliseconds = time.getMilliseconds();
  let seconds = time.getSeconds();
  console.log(message, seconds + '.' + milliseconds, 'seconds');
}

export function formatDate(date) {
  const options = {year: '2-digit', month: 'numeric', day: 'numeric'};
  return date.toLocaleDateString(undefined, options);
}

/**
 * Returns an array of schedule days (which is an array of separate reading objects for the day)
 * for use in a FlatList typically
 * @param {Database} db
 * @param {string} tableName
 * @param {boolean} doesTrack
 */
export async function loadData(DB, tableName, doesTrack) {
  if (!DB) {
    return;
  }

  let results = await runSQL(DB, `SELECT * FROM ${tableName};`);

  if (!results) {
    return;
  }

  var listItems = [];

  var innerItems = [];
  var previousDate;

  for (let i = 0; i < results.rows.length; ++i) {
    const item = {
      ...results.rows.item(i),
      doesTrack: doesTrack,
    };
    if (item.ReadingDayID) {
      if (item.CompletionDate === previousDate) {
        innerItems.push(item);
      } else {
        if (innerItems.length > 0) {
          listItems.push(innerItems);
        }
        innerItems = [item];
        previousDate = item.CompletionDate;
      }

      if (i >= results.rows.length - 1) {
        listItems.push(innerItems);
      }
    } else {
      listItems.push(item);
    }
  }

  return listItems;
}

export async function appVersion(userDB) {
  let prevVersion;
  let currVersion = version;

  await runSQL(
    userDB,
    'SELECT Description FROM tblUserPrefs WHERE Name="AppVersion";',
  ).then(res => {
    prevVersion = res.rows.item(0).Description;
  });

  if (prevVersion !== currVersion) {
    await runSQL(
      userDB,
      'UPDATE tblUserPrefs SET Description=? WHERE Name="AppVersion";',
      [currVersion],
    );
  }
  return {prevVersion, currVersion};
}

/**
 * Returns the user_version of the given database
 * @param {Database} db
 */
export async function getVersion(DB) {
  let result = await runSQL(DB, 'PRAGMA user_version;');

  return result.rows.item(0).user_version;
}

/**
 * A centralized query function to make other code cleaner, more readable, and to centralize error handling
 * @param {Database} DB
 * @param {string} sql
 * @param {array} args
 * @returns {DBQueryResult}
 */
export async function runSQL(DB, sql, args = []) {
  let result;
  await DB.executeSql(sql, args)
    .then(([res]) => {
      result = res;
    })
    .catch(errorCB);

  return result;
}

/**
 * Returns an object with the items from tblUserPrefs as the keys
 * @param {Database} userDB
 * @returns {object}
 * @property {integer} showDaily.ID
 * @property {boolean} showDaily.Value - Should the home page show the daily portion of the weekly reading
 * @property {integer} weeklyReadingResetDay.ID
 * @property {integer} weeklyReadingResetDay.Value - The day of the week to recreate the weekly reading schedule
 */
export async function getSettings(userDB) {
  let showDaily;
  let weeklyReadingResetDay;

  let tblUserPrefs = await runSQL(userDB, 'SELECT * FROM tblUserPrefs;');
  if (tblUserPrefs.rows.length > 0) {
    for (let i = 0; i < tblUserPrefs.rows.length; i++) {
      const pref = tblUserPrefs.rows.item(i);
      switch (pref.Name) {
        case 'ShowWeeklyReadingDailyPortion':
          showDaily = {id: pref.ID, value: pref.Value ? true : false};
          break;
        case 'WeeklyReadingResetDay':
          weeklyReadingResetDay = {id: pref.ID, value: pref.Value};
          break;
        case 'AppVersion':
          break;
        default:
          console.log(
            'Name of tblUserPrefs item is not included in switch statement',
          );
          break;
      }
    }
  }

  return {showDaily, weeklyReadingResetDay};
}

async function replaceDB(db) {
  let dbName = db.dbname;
  let DB;

  var path = LocalDBPath + '/' + dbName;

  await RNFS.unlink(path)
    .then(() => {
      console.log('FILE DELETED');
    })
    .catch(err => {
      console.log(err.message);
    });

  await SQLite.openDatabase({
    name: dbName,
    createFromLocation: 1,
  })
    .then(newDB => {
      log('Replaced old database with', newDB);
      DB = newDB;
    })
    .catch(errorCB);

  return DB;
}

function setDatabaseParameters(upgradeJSON) {
  return JSON.parse(
    JSON.stringify(upgradeJSON).replace(/@\{(\w+)\}/g, (match, group) => {
      switch (group) {
        case 'baseDate':
          let date = formatDate(new Date(0));
          return date;
        case 'baseTime':
          let time = formatDate(new Date(2020, 0, 1, 8, 0, 0));
          return time;
        case 'weeklyReadingStartDate':
          //This year we will start at August 3rd. This refers to the 30th day in the schedule
          //This way I don't have to fuss with the memorial reading and stuff
          //See below (NOTE: the middle number for month starts at 0. so august is 7)
          let weekReadDate = new Date(2020, 7, 3);
          return weekReadDate;
        case 'weeklyReadingStartOrder':
          return 30;
        case 'dailyReading':
          return translate('reminders.dailyReading');
        case 'dailyText':
          return translate('reminders.dailyText');
        case 'weeklyReading':
          return translate('reminders.weeklyReading.title');
        case 'midweekMeetingStudy':
          return translate('reminders.midweekMeetingStudy');
        case 'weekendMeetingStudy':
          return translate('reminders.weekendMeetingStudy');
        case 'daily':
          return FREQS.DAILY;
        case 'weekly':
          return FREQS.WEEKLY;
        case 'monthly':
          return FREQS.MONTHLY;
      }
    }),
  );
}

/**
 * Checks the user's database version and runs sql statements from the upgradeJSON to update it
 * accordingly if the version there does not match the user's
 * @param {Database} db
 * @param {object} upgradeJSON
 */
export async function upgradeDB(db, upgradeJSON) {
  let DB;

  log('Upgrading', db.dbname);

  //Replace @{foo} strings with appropriate values
  var json = setDatabaseParameters(upgradeJSON);

  let upgradeVersion = upgradeJSON.version;
  let userVersion = await getVersion(db);

  log('upgradeVersion', upgradeVersion, 'userVersion', userVersion);

  if (userVersion < upgradeVersion) {
    let statements = [];
    let version = upgradeVersion - (upgradeVersion - userVersion) + 1;

    if (!upgradeJSON.upgrades) {
      log('Replacing DB:', db.dbname, '.....');
      DB = await replaceDB(db, upgradeJSON.name);
      return DB;
    }

    let length = Object.keys(json.upgrades).length;

    log('version', version, 'json.upgrades.length', length);

    for (let i = 0; i < length; i += 1) {
      let upgrade = json.upgrades[`to_v${version}`];

      log(upgrade);

      if (upgrade) {
        statements = [...statements, ...upgrade];
      } else {
        break;
      }

      version++;
    }

    statements = [
      ...statements,
      ...[[`PRAGMA user_version = ${upgradeVersion};`, []]],
    ];

    log(statements);

    await db
      .sqlBatch(statements)
      .then(() => {
        console.log('Populated database OK');
      })
      .catch(error => {
        console.log('SQL batch ERROR: ' + error.message);
      });
  }

  return db;
}

/**
 * A binary search algorithm for finding a target value in a query result from the database if given
 * a secondary value and key it will search for a value that satisfies both values for my purposes I
 * only need 2 in my algorithm. So this was easier to make than a more general case.
 * @param {DBQueryResult} query
 * @param {string} primaryKey
 * @param {*} primaryTargetValue
 * @param {string} secondaryKey
 * @param {*} secondaryTargetValue
 */
export function searchQuery(
  query,
  primaryKey,
  primaryTargetValue,
  secondaryKey,
  secondaryTargetValue,
) {
  var index = 0;
  var safetyCheck = 0;
  var safetyBoundary = 2000;
  var found = false;
  var prevIndex;
  var startPointer = 0;
  var endPointer = query.rows.length;

  while (!found && safetyCheck < safetyBoundary) {
    let isHigh;
    prevIndex = index;

    index = (startPointer + endPointer) / 2;

    //This is a fast way to remove trailing decimal digits
    // eslint-disable-next-line no-bitwise
    index = index | 0;

    //Prevent endless loop when start and end pointers are only 1 apart
    if (index === prevIndex) {
      index++;
    }

    let primaryValueAtIndex = query.rows.item(index)[primaryKey];
    let secondaryValueAtIndex;
    let hasSecondaryValue = false;
    if (secondaryKey && secondaryTargetValue) {
      secondaryValueAtIndex = query.rows.item(index)[secondaryKey];
      hasSecondaryValue = true;
    }

    if (primaryValueAtIndex > primaryTargetValue) {
      isHigh = true;
    } else if (primaryValueAtIndex < primaryTargetValue) {
      isHigh = false;
    } else {
      if (hasSecondaryValue) {
        if (secondaryValueAtIndex > secondaryTargetValue) {
          isHigh = true;
        } else if (secondaryValueAtIndex < secondaryTargetValue) {
          isHigh = false;
        } else {
          found = true;
        }
      } else {
        found = true;
      }
    }

    if (isHigh) {
      endPointer = index;
    } else {
      startPointer = index;
    }
    safetyCheck++;

    if (safetyCheck >= safetyBoundary) {
      console.log('Exited with safety check');
    }
  }

  return index;
}
