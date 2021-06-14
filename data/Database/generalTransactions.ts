import SQLite from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';
//@ts-ignore
import {LocalDBPath} from '../fileSystem';
import {translate} from '../../logic/localization/localization';
import {FREQS} from '../../logic/general';
import {
  BibleReadingItem,
  Database,
  DBBibleReadingItem,
  DBQueryResult,
  DBReadingItem,
  ReadingItem,
} from './types';
const {version}: {version: string} = require('../../package.json');
const shouldLog = false;

SQLite.enablePromise(true);

export function log(...args: any[]) {
  if (shouldLog) {
    console.log(...args);
  }
}

export function errorCB(err: {message: string}) {
  console.warn('SQL Error: ' + err.message);
}

export async function updateValue(
  DB: Database,
  tableName: string,
  id: number,
  column: string,
  value: string | number,
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

export function createPlaceholdersFromArray(array: any[]) {
  let values: any[] = [];
  const thisFunc = (innerArray: any[]) => {
    let innerString = innerArray.map(() => '?').join(',');

    let result = `( ${innerString} )`;
    return result;
  };

  let placeholders;

  if (Array.isArray(array[0])) {
    placeholders = array.map(thisFunc).join(',');
    array.map((innerArray: any[]) => {
      innerArray.map((value: any) => values.push(value));
    });
  } else {
    thisFunc(array);
    values = [...array];
  }

  return {placeholders, values};
}

export function timeKeeper(message: string) {
  let time = new Date();
  let milliseconds = time.getMilliseconds();
  let seconds = time.getSeconds();
  console.log(message, seconds + '.' + milliseconds, 'seconds');
}

export function formatDate(date: Date) {
  const options = {year: '2-digit', month: 'numeric', day: 'numeric'} as const;
  return date.toLocaleDateString(undefined, options);
}

export function convertDBItemToJSItem(
  item: DBReadingItem | DBBibleReadingItem,
  doesTrack: boolean,
): ReadingItem | BibleReadingItem {
  let convertedItem: ReadingItem | BibleReadingItem = {
    completedHidden: false,
    completionDate: new Date(item.CompletionDate),
    doesTrack,
    isFinished: !!item.IsFinished,
    readingDayID: item.ReadingDayID,
    onLongPress: () => {},
    onPress: () => {},
    tableName: '',
    title: '',
    readingPortion: item.ReadingPortion,
    updateValue: 0,
  };
  const bibleItem = item as DBBibleReadingItem;
  if (!bibleItem.StartBookNumber) return convertedItem;

  convertedItem = {
    ...convertedItem,
    endBookName: bibleItem.EndBookName,
    endBookNumber: bibleItem.EndBookNumber,
    endChapter: bibleItem.EndChapter,
    endVerse: bibleItem.EndVerse,
    startBookName: bibleItem.StartBookName,
    startBookNumber: bibleItem.StartBookNumber,
    startChapter: bibleItem.StartChapter,
    startVerse: bibleItem.StartVerse,
    versePosition: bibleItem.VersePosition,
  };

  return convertedItem;
}

/** Returns an array of schedule days (which is an array of separate reading objects for the day) for use in a FlatList typically */
export async function loadData(
  DB: Database,
  tableName: string,
  doesTrack: boolean,
  completedHidden?: boolean,
) {
  if (!DB) return;

  let results = await runSQL(DB, `SELECT * FROM ${tableName};`);

  if (!results) return;

  var listItems = [];

  var innerItems: (ReadingItem | BibleReadingItem)[] = [];
  var previousDate;

  for (let i = 0; i < results.rows.length; ++i) {
    const item: DBReadingItem | DBBibleReadingItem = results.rows.item(i);
    if (completedHidden && item.IsFinished) continue;

    if (item.ReadingDayID) {
      const newItem = convertDBItemToJSItem(item, doesTrack);

      if (newItem.completionDate === previousDate) {
        innerItems.push(newItem);
      } else {
        if (innerItems.length > 0) {
          listItems.push(innerItems);
        }
        innerItems = [newItem];
        previousDate = newItem.completionDate;
      }

      if (i >= results.rows.length - 1) {
        listItems.push(innerItems);
      }
    } else {
      //This is not a reading schedule item
      listItems.push(item);
    }
  }

  return listItems;
}

export async function appVersion(userDB: Database) {
  let prevVersion;
  let currVersion = version;

  await runSQL(
    userDB,
    'SELECT Description FROM tblUserPrefs WHERE Name="AppVersion";',
  ).then((res) => {
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

/** Returns the user_version of the given database */
export async function getVersion(DB: Database) {
  let result = await runSQL(DB, 'PRAGMA user_version;');

  return result.rows.item(0).user_version;
}

/** A centralized query function to make other code cleaner, more readable, and to centralize error handling */
export async function runSQL(DB: Database, sql: string, args: any[] = []) {
  let [result]: DBQueryResult[] = await DB.executeSql(sql, args).catch(errorCB);

  return result;
}

/**
 * Returns an object with the items from tblUserPrefs as the keys
 * @property {boolean} showDaily.Value - Should the home page show the daily portion of the weekly reading
 * @property {integer} weeklyReadingResetDay.Value - The day of the week to recreate the weekly reading schedule
 */
export async function getSettings(userDB: Database) {
  let showDaily = {id: -1, value: false};
  let weeklyReadingResetDay = {id: -1, value: -1};

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

async function replaceDB(db: Database) {
  let dbName = db.dbname;
  let DB;

  var path = LocalDBPath + '/' + dbName;

  await RNFS.unlink(path)
    .then(() => {
      console.log('FILE DELETED');
    })
    .catch((err) => {
      console.log(err.message);
    });
  //@ts-ignore
  await SQLite.openDatabase({
    name: dbName,
    createFromLocation: 1,
  })
    .then((newDB: any) => {
      log('Replaced old database with', newDB);
      DB = newDB;
    })
    .catch(errorCB);

  return DB;
}

function setDatabaseParameters(upgradeJSON: any) {
  return JSON.parse(
    JSON.stringify(upgradeJSON).replace(/@\{(\w+)\}/g, (match, group) => {
      switch (group) {
        case 'baseDate':
          let date = new Date(0);
          return date.toISOString();
        case 'baseTime':
          let time = new Date(2020, 0, 1, 8, 0, 0);
          return time.toISOString();
        case 'weeklyReadingStartDate':
          //This year we will start at August 3rd. This refers to the 30th day in the schedule
          //This way I don't have to fuss with the memorial reading and stuff
          //See below (NOTE: the middle number for month starts at 0. so august is 7)
          let weekReadDate = new Date(2020, 7, 3);
          return weekReadDate.toISOString();
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

/** Checks the user's database version and runs sql statements from the upgradeJSON to update it accordingly if the version there does not match the user's */
export async function upgradeDB(
  db: Database,
  upgradeJSON: {version: number; upgrades: Array<string[]>; name: any},
) {
  let DB;

  log('Upgrading', db.dbname);

  //Replace @{foo} strings with appropriate values
  var json = setDatabaseParameters(upgradeJSON);

  let upgradeVersion = upgradeJSON.version;
  let userVersion = await getVersion(db);

  log('upgradeVersion', upgradeVersion, 'userVersion', userVersion);

  if (userVersion < upgradeVersion) {
    let statements: any[] = [];
    let version = upgradeVersion - (upgradeVersion - userVersion) + 1;

    if (!upgradeJSON.upgrades) {
      log('Replacing DB:', db.dbname, '.....');
      DB = await replaceDB(db);
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
      ...[[`PRAGMA user_version=${upgradeVersion};`, []]],
    ];

    log(statements);

    await db
      .sqlBatch(statements)
      .then(() => {
        console.log('Populated database OK');
      })
      .catch((error: {message: string}) => {
        console.log('SQL batch ERROR: ' + error.message);
      });
  }

  return db;
}

/** A binary search algorithm for finding a target value in a query result from the database if given a secondary value and key it will search for a value that satisfies both values for my purposes I only need 2 in my algorithm. So this was easier to make than a more general case. */
export function searchQuery(
  query: DBQueryResult,
  primaryKey: string,
  primaryTargetValue: number,
  secondaryKey?: string,
  secondaryTargetValue?: number,
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
    if (secondaryKey && secondaryTargetValue) {
      secondaryValueAtIndex = query.rows.item(index)[secondaryKey];
    }

    if (primaryValueAtIndex > primaryTargetValue) {
      isHigh = true;
    } else if (primaryValueAtIndex < primaryTargetValue) {
      isHigh = false;
    } else {
      if (secondaryKey && secondaryTargetValue) {
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
