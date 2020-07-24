const shouldLog = false;
import SQLite from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';
import {LocalDBPath, PrePopulatedDBPath} from '../fileSystem';

SQLite.enablePromise(true);

export function log() {
  if (shouldLog) {
    console.log(...arguments);
  }
}

export function errorCB(err) {
  console.warn('SQL Error: ' + err.message);
}

function createSqlString() {
  let args = [...arguments];
  return args.join(' ');
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

export async function loadData(db, setState, tableName) {
  if (db) {
    let results;
    await db
      .transaction(txn => {
        txn.executeSql('SELECT * FROM ' + tableName, []).then(([t, res]) => {
          results = res;
        });
      })
      .catch(errorCB);

    var listItems = [];

    var innerItems = [];
    var previousDate;

    for (let i = 0; i < results.rows.length; ++i) {
      const item = results.rows.item(i);
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
      } else {
        listItems.push(item);
      }
    }

    setState(listItems);
  }
}

export async function getVersion(db) {
  let result;

  await db
    .transaction(txn => {
      txn.executeSql('PRAGMA user_version;', []).then(([txn, res]) => {
        result = res;
      });
    })
    .catch(errorCB);

  return result;
}

export async function getQuery(bibleDB, sql) {
  let result;
  await bibleDB
    .transaction(txn => {
      txn.executeSql(sql, []).then(([t, res]) => {
        result = res;
      });
    })
    .catch(errorCB);

  return result;
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

export async function upgradeDB(db, upgradeJSON) {
  let DB;
  let res = await getVersion(db);

  log('Upgrading', db.dbname);

  var json = JSON.parse(
    JSON.stringify(upgradeJSON).replace(/@\{(\w+)\}/g, (match, group) => {
      if (group === 'baseDate') {
        let date = formatDate(new Date(0));
        return date;
      }
    }),
  );

  let upgradeVersion = upgradeJSON.version;
  let userVersion = res.rows.item(0).user_version;

  log('upgradeVersion', upgradeVersion, 'userVersion', userVersion);

  if (userVersion < upgradeVersion) {
    let statements = [];
    let version = upgradeVersion - (upgradeVersion - userVersion) + 1;

    if (!upgradeJSON.upgrades) {
      log('Replacing DB:', db.dbname, '.....');
      await replaceDB(db, upgradeJSON.name).then(res => {
        DB = res;
      });
      return DB;
    }

    let length = Object.keys(json.upgrades).length;

    log('version', version, 'length', length);

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

export function listAllTables(db, cb) {
  if (!cb) {
    cb = ([txn, results]) => {
      for (let i = 0; i < results.rows.length; i++) {
        console.log(results.rows.item(i));
      }
    };
  }

  db.transaction(txn => {
    txn
      .executeSql(
        `
        SELECT 
            name
        FROM 
            sqlite_master 
        WHERE 
            type ='table' AND 
            name NOT LIKE 'sqlite_%';`,
        [],
      )
      .then(cb);
  });
}

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

  log(
    'Search query:',
    'safetyCheck=',
    safetyCheck,
    'startPointer=',
    startPointer,
    'endPointer=',
    endPointer,
    'found=',
    found,
  );

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

  log(
    'Search query:',
    'safetyCheck=',
    safetyCheck,
    'startPointer=',
    startPointer,
    'endPointer=',
    endPointer,
    'found=',
    found,
  );

  return index;
}
