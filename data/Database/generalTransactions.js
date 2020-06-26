const shouldLog = true;

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

export function getVersion(db, cb) {
  db.transaction(txn => {
    txn.executeSql('PRAGMA user_version;', [], cb);
  }, errorCB);
}

export function upgradeDB(db, upgradeJSON) {
  getVersion(db, (txn, res) => {
    let upgradeVersion = upgradeJSON.version;
    let userVersion = res.rows.item(0).user_version;

    log('upgradeVersion', upgradeVersion, 'userVersion', userVersion);

    if (userVersion < upgradeVersion) {
      let statements = [];
      let version = upgradeVersion - (upgradeVersion - userVersion) + 1;
      let length = Object.keys(upgradeJSON.upgrades).length;

      log('version', version, 'length', length);

      for (let i = 0; i < length; i += 1) {
        let upgrade = upgradeJSON.upgrades[`to_v${version}`];

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

      return db.sqlBatch(
        statements,
        () => {
          console.log('Populated database OK');
        },
        error => {
          console.log('SQL batch ERROR: ' + error.message);
        },
      );
    }
  });
}

export function openTable(db, tableName, cb) {
  db.transaction(txn => {
    txn.executeSql(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`,
      [],
      cb,
    );
  }, errorCB);
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
