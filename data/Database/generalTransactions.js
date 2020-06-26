const shouldLog = false;

export function log() {
  if (shouldLog) {
    console.log(...arguments);
  }
}

export function errorCB(err) {
  console.log('SQL Error: ' + err.message);
}

export function timeKeeper(message) {
  let time = new Date();
  log(message, time);
}

export function openTable(db, tableName, cb) {
  db.transaction(function(txn) {
    txn.executeSql(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`,
      [],
      cb,
    );
  }, errorCB);
}

export function addColumnToTable(txn, tableName, columnName, columnInfo) {
  txn.executeSql(`PRAGMA table_info(${tableName});`, [], (txn, res) => {
    let found;

    for (let i = 0; i < res.rows.length; i++) {
      const element = res.rows.item(i);

      if (element.name === columnName) {
        found = true;
        break;
      }
    }

    if (!found) {
      txn.executeSql(
        `ALTER TABLE tblSchedules ADD ${columnName} ${columnInfo};`,
        [],
      );
    }
  });
}

export function listAllTables(db, cb) {
  if (!cb) {
    cb = (txn, results) => {
      for (let i = 0; i < results.rows.length; i++) {
        console.log(results.rows.item(i));
      }
    };
  }

  db.transaction(function(txn) {
    txn.executeSql(
      `
    SELECT 
        name
    FROM 
        sqlite_master 
    WHERE 
        type ='table' AND 
        name NOT LIKE 'sqlite_%';`,
      [],
      cb,
    );
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
      'isHigh=',
      isHigh,
    );

    if (safetyCheck >= safetyBoundary) {
      console.log('Exited with safety check');
    }
  }

  return index;
}
