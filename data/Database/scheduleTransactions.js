import {
  getWeekdays,
  getWeeksBetween,
  SCHEDULE_TYPES,
  VERSE_POSITION,
  WEEKLY_READING_TABLE_NAME,
} from '../../logic/general';
import {translate} from '../../logic/localization/localization';
import {
  generateBibleSchedule,
  generateCustomSchedule,
  generateWeeklyReadingSchedule,
} from '../../logic/scheduleCreation';
import {
  createPlaceholdersFromArray,
  errorCB,
  log,
  runSQL,
  timeKeeper,
} from './generalTransactions';

//---------------------------------------- Creating schedules ----------------------------------------

const bibleScheduleValuesArray = [
  'StartBookName',
  'StartBookNumber',
  'StartChapter',
  'StartVerse',
  'EndBookName',
  'EndBookNumber',
  'EndChapter',
  'EndVerse',
  'CompletionDate',
  'ReadingPortion',
  'VersePosition',
];

const customScheduleValuesArray = ['CompletionDate', 'ReadingPortion'];

/** @param {integer} id */
export function formatScheduleTableName(id) {
  const tableName = 'tblSchedule' + id;

  return tableName;
}

export async function insertReadingPortions(
  userDB,
  readingPortions,
  tableName,
  valuesArray,
  startIndex = 0,
) {
  let length = readingPortions.length;
  let temp = [];
  let endIndex;
  let isEnd;
  let wasSuccessful = true;

  if (length > 50) {
    if (length - startIndex > 50) {
      endIndex = startIndex + 50;
      isEnd = false;
    } else {
      endIndex = length;
      isEnd = true;
    }
    temp = readingPortions.slice(startIndex, endIndex);
    startIndex = endIndex;
  } else {
    temp = [...readingPortions];
    isEnd = true;
  }

  let {placeholders, values} = createPlaceholdersFromArray(temp);

  await runSQL(
    userDB,
    `INSERT INTO ${tableName} (${valuesArray}) VALUES ${placeholders};`,
    values,
  ).then((res) => {
    if (res.rowsAffected > 0) {
      log('Insert success');
    } else {
      wasSuccessful = false;
      console.log('Insert failed');
    }
  });

  //If there are more than 50 results we keep cycling until we have inserted all of them
  if (!isEnd) {
    await insertReadingPortions(
      userDB,
      readingPortions,
      tableName,
      valuesArray,
      startIndex,
    ).then((result) => {
      if (wasSuccessful) {
        wasSuccessful = result;
      }
    });
  }

  return wasSuccessful;
}

/**
 * @param {Database} userDB
 * @param {string} tableName
 * @param {ScheduleType} scheduleType
 */
export async function createScheduleTable(userDB, tableName, scheduleType) {
  let SQL;

  if (scheduleType !== SCHEDULE_TYPES.CUSTOM) {
    SQL = `CREATE TABLE IF NOT EXISTS ${tableName}
              (ReadingDayID INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE, 
              StartBookName VARCHAR(20), 
              StartBookNumber TINYINT, 
              StartChapter TINYINT, 
              StartVerse TINYINT,
              EndBookName VARCHAR(20), 
              EndBookNumber TINYINT, 
              EndChapter TINYINT, 
              EndVerse TINYINT,
              VersePosition TINYINT DEFAULT ${VERSE_POSITION.MIDDLE},
              CompletionDate DATE,
              ReadingPortion VARCHAR(20), 
              IsFinished BOOLEAN DEFAULT 0);`;
  } else {
    SQL = `CREATE TABLE IF NOT EXISTS ${tableName}
              (ReadingDayID INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
              CompletionDate DATE,
              ReadingPortion VARCHAR(20), 
              IsFinished BOOLEAN DEFAULT 0);`;
  }

  //Create a table for this new schedule based on the formated name
  await runSQL(userDB, SQL).then(() => {
    log('Table', tableName, 'created successfully');
  });

  return;
}

/**
 * Creates a Bible reading schedule or a custom schedule.
 * If creating a Bible reading schedule, then duration, bookId, chapter, and verse are required.
 * StartingPortion, maxPortion, readingPortionDesc, and portionsPerDay are not.
 * If creating a custom schedule, then it is the oposite.
 * @param {Database} userDB
 * @param {Database} bibleDB
 * @param {ScheduleType} scheduleType
 * @param {string} scheduleName
 * @param {boolean} [doesTrack=true] - Should the schedule keep track of the completion dates for reading days?
 * @param {Array<(0|1)>} [activeDays=[1,1,1,1,1,1,1]] - A length 7 array of 1s or 0s. For future versions where the user can choose which weekdays they would like to read on and which weekdays to skip
 * @param {number} duration - The length (in years) the user wants the Bible reading schedule to last
 * @param {integer} bookId - The number of the Bible book the user chose to start from
 * @param {integer} chapter - The number of the Bible book the user chose to start from
 * @param {integer} verse - The number of the Bible book the user chose to start from
 * @param {number} startingPortion - (Must be between 0 and 1,000,000,000,000,000) The portion to begin the schedule from
 * @param {number} maxPortion - The number of the last portion in the publication
 * @param {string} readingPortionDesc - A user provided description of the sections to break up their reading by
 * @param {number} portionsPerDay - How many portions to read each day
 * @param {Function} successCallBack
 * @param {Function} errorCallBack
 * @property {Date} startDate - Date to start schedule generation from
 */
export async function addSchedule(
  userDB,
  bibleDB,
  scheduleType,
  scheduleName,
  doesTrack = true,
  activeDays = [1, 1, 1, 1, 1, 1, 1],
  duration,
  bookId,
  chapter,
  verse,
  startingPortion,
  maxPortion,
  readingPortionDesc,
  portionsPerDay,
  successCallBack,
  errorCallBack,
  startDate = new Date(),
) {
  log(
    `______________________ New Schedule named ${scheduleName} ______________________`,
  );
  timeKeeper('Started at...');

  let scheduleNameExists;
  let tableName;
  let creationInfo;

  //Check if a schedule with that name already exists
  await runSQL(userDB, 'SELECT 1 FROM tblSchedules WHERE ScheduleName=?;', [
    scheduleName,
  ]).then((res) => {
    scheduleNameExists = res.rows.length > 0;
  });

  if (scheduleType !== SCHEDULE_TYPES.CUSTOM) {
    creationInfo = {
      duration: duration,
      bookId: bookId,
      chapter: chapter,
      verse: verse,
    };
  } else {
    creationInfo = {
      startingPortion: startingPortion,
      maxPortion: maxPortion,
      readingPortionDesc: readingPortionDesc,
      portionsPerDay: portionsPerDay,
    };
  }

  if (scheduleNameExists) {
    errorCallBack(translate('prompts.nameTaken'));
    return;
  }

  log('Creating schehdule table');

  //If it doesn't already exist, add a value to the schedules table with correlating info
  await runSQL(
    userDB,
    `INSERT INTO
          tblSchedules (
            ScheduleName,
            HideCompleted,
            DoesTrack,
            ScheduleType,
            StartDate,
            CreationInfo,
            IsDay0Active,
            IsDay1Active,
            IsDay2Active,
            IsDay3Active,
            IsDay4Active,
            IsDay5Active,
            IsDay6Active)
            VALUES (?, 0, ?, ?, ?,
              ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      scheduleName,
      doesTrack,
      scheduleType,
      startDate.toISOString(),
      JSON.stringify(creationInfo),
      ...activeDays,
    ],
  ).then(() => {
    log(scheduleName, 'inserted successfully');
  });

  //Get the newly created schedule info to extract it's ID to use for unique table name creation
  await runSQL(
    userDB,
    'SELECT ScheduleID FROM tblSchedules WHERE ScheduleName=?;',
    [scheduleName],
  ).then((res) => {
    let id = res.rows.item(0).ScheduleID;
    tableName = formatScheduleTableName(id);

    log('Creating table for schedule', scheduleName, 'named', tableName);
  });

  await createScheduleTable(userDB, tableName, scheduleType);

  let readingPortions;
  let adjustedVerseMessage;
  let valuesArray;
  //Populate the table with reading information
  if (scheduleType !== SCHEDULE_TYPES.CUSTOM) {
    let result = await generateBibleSchedule(
      bibleDB,
      scheduleType,
      duration,
      bookId,
      chapter,
      verse,
      startDate,
    );

    readingPortions = result.readingPortions;
    adjustedVerseMessage = result.adjustedVerseMessage;
    valuesArray = bibleScheduleValuesArray;
  } else {
    readingPortions = generateCustomSchedule(
      startingPortion,
      maxPortion,
      readingPortionDesc,
      portionsPerDay,
      startDate,
    );
    valuesArray = customScheduleValuesArray;
  }

  await insertReadingPortions(userDB, readingPortions, tableName, valuesArray)
    .then((wasSucessful) => {
      if (wasSucessful) {
        console.log('Every insert was successful');
        if (adjustedVerseMessage) {
          errorCallBack(adjustedVerseMessage);
        }
        successCallBack();
      } else {
        console.log('Insert failed');
      }
      timeKeeper('Ended at.....');
    })
    .catch((err) => {
      errorCB(err);
      timeKeeper('Ended at.....');
    });
}

/**
 * Creates a Bible reading schedule based on the weekly Christian Life and Ministry meeting workbook
 * recreated on a user defined weekday each week (usually the day after their meeting)
 * @param {Database} userDB
 * @param {Database} bibleDB
 * @param {integer} resetDayOfWeek - (0 - 6) The weekday to recreate the schedule on
 * @param {boolean} [shouldForceUpdate=false] - An (optional) flag which, when used will recreate the schedule regardless of any other factors
 */
export async function createWeeklyReadingSchedule(
  userDB,
  bibleDB,
  resetDayOfWeek,
  shouldForceUpdate,
) {
  let date = new Date();
  /*
    This returns 0 - 6 based on the day the user wishes to reset, for instance, if it resets
    on Thursday, then Wednesday will be index 6 of the week and Thursday will be index 0 of
    the week (Thanks Number Theory!)
    */
  let adjustedWeekIndex = getWeekdays().beforeToday(resetDayOfWeek);
  console.log('adjustedWeekIndex "After"', adjustedWeekIndex);
  let adjustedDate = date.getDate() - adjustedWeekIndex;
  date.setDate(adjustedDate);
  date.setHours(0, 0, 0, 0);
  let weeklyReadingCurrent;
  let weeklyReadingStart;
  let weeklyReadingInfo;
  let tableName = WEEKLY_READING_TABLE_NAME;

  timeKeeper('Started at creating weekly reading schedule at.....');

  let tblDates = await runSQL(
    userDB,
    'SELECT * FROM tblDates WHERE Name="WeeklyReadingStart" OR Name="WeeklyReadingCurrent";',
  );

  for (let i = 0; i < tblDates.rows.length; i++) {
    const name = tblDates.rows.item(i).Name;
    switch (name) {
      case 'WeeklyReadingStart':
        weeklyReadingStart = tblDates.rows.item(i);
        break;
      case 'WeeklyReadingCurrent':
        weeklyReadingCurrent = tblDates.rows.item(i).Date;
        break;
    }
  }

  //The description of this date is the order in which it falls matching the Weekly Order in the bibleDB
  let startIndex = parseInt(weeklyReadingStart.Description, 10);

  let weeklyReadingStartDate = new Date(weeklyReadingStart.Date);
  //The start date is always a monday of a schedule that would end late for the user.
  //We need to set the start date to compensate for this.
  let weekStartAligner = resetDayOfWeek - 8;
  weeklyReadingStartDate.setDate(weekStartAligner);

  let currentWeek = getWeeksBetween(weeklyReadingStartDate, date) + startIndex;

  let lastWeekRead =
    getWeeksBetween(weeklyReadingStartDate, weeklyReadingCurrent) + startIndex;

  log(
    'creating weekly reading schedule',
    'date',
    date,
    'adjustedWeekIndex',
    adjustedWeekIndex,
    'adjustedDate',
    adjustedDate,
    'startIndex',
    startIndex,
    'currentWeek',
    currentWeek,
    'lastWeekRead',
    lastWeekRead,
    'weeklyReadingCurrent',
    weeklyReadingCurrent,
    'weeklyReadingStart',
    weeklyReadingStart,
    'resetDayOfWeek',
    resetDayOfWeek,
  );

  if (lastWeekRead < currentWeek || shouldForceUpdate) {
    await updateDates(userDB, date, 'WeeklyReadingCurrent', () => {});

    //drop table from previous week
    await runSQL(userDB, `DROP TABLE IF EXISTS ${tableName};`);

    await runSQL(
      userDB,
      'DELETE FROM tblSchedules WHERE CreationInfo=? OR CreationInfo IS NULL;',
      [tableName],
    );

    let scheduleName = translate('reminders.weeklyReading.title');

    await runSQL(
      userDB,
      'INSERT INTO tblSchedules (ScheduleName, HideCompleted, ScheduleType, CreationInfo) VALUES (?, 0, ?, ?);',
      [scheduleName, SCHEDULE_TYPES.SEQUENTIAL, tableName],
    ).then(() => {
      log(scheduleName, 'inserted successfully');
    });

    await createScheduleTable(userDB, tableName);

    //Generate schedule for current week
    weeklyReadingInfo = await runSQL(
      bibleDB,
      'SELECT * FROM tblVerseIndex WHERE WeeklyOrder=?;',
      [currentWeek],
    );

    let readingPortions = generateWeeklyReadingSchedule(
      weeklyReadingInfo,
      date,
    );

    await insertReadingPortions(
      userDB,
      readingPortions,
      tableName,
      bibleScheduleValuesArray,
    )
      .then((wasSucessful) => {
        if (!wasSucessful) {
          console.log('Insert failed');
        }
        timeKeeper('Ended at.....');
      })
      .catch((err) => {
        errorCB(err);
        timeKeeper('Ended at.....');
      });

    timeKeeper('Ended after creating table at.....');
  } else {
    timeKeeper('Ended after doing nothing at.....');
  }
}

//------------------------------------- Updating schedule info -------------------------------------

/**
 * Deletes a schedule from the database and the reference to such schedule in tblSchedules
 * @param {Database} userDB
 * @param {string} tableName - A string formatted from the function formatScheduleTableName
 * @param {string} scheduleName
 */
export async function deleteSchedule(userDB, tableName, scheduleName) {
  await runSQL(userDB, 'DELETE FROM tblSchedules WHERE ScheduleName=?;', [
    scheduleName,
  ]);

  await runSQL(userDB, `DROP TABLE IF EXISTS ${tableName};`).then(() => {
    console.log('Deleted table ', tableName);
  });
}

/**
 * Updates the read flag in a schedule table of a reading day item
 * @param {Database} userDB
 * @param {string} tableName - A string formatted from the function formatScheduleTableName
 * @param {integer} id - The reading day ID of the item to be updated
 * @param {boolean} status - The value to update the status to
 * @param {Function} afterUpdate - A callback to be fired when the update has completed
 */
export function updateReadStatus(
  userDB,
  tableName,
  id,
  status = true,
  afterUpdate,
) {
  let bool = status ? 1 : 0;

  runSQL(userDB, `UPDATE ${tableName} SET IsFinished=? WHERE ReadingDayID=?;`, [
    bool,
    id,
  ]).then(afterUpdate);
}

export async function updateScheduleStartDate(
  userDB,
  bibleDB,
  scheduleName,
  newStartDate,
) {
  await recreateSchedule(userDB, bibleDB, scheduleName, {
    startDate: newStartDate,
  });
}

/**
 * Updates the read flag in a schedule table for multiple reading day items
 * @requires 0 < startID < endID
 * @param {Database} userDB
 * @param {string} tableName
 * @param {integer} endID
 * @param {integer} startID
 * @param {boolean} status
 */
export async function updateMultipleReadStatus(
  userDB,
  tableName,
  endID,
  startID = 1,
  status = true,
) {
  let bool = status ? 1 : 0;

  await runSQL(
    userDB,
    `UPDATE ${tableName} SET IsFinished=? WHERE ReadingDayID<=? AND ReadingDayID>=?;`,
    [bool, endID, startID],
  );
}

/**
 * Adjusts schedule name in the database for a reading schedule
 * @param {Database} userDB
 * @param {string} curScheduleName
 * @param {string} newScheduleName
 */
export async function renameSchedule(userDB, curScheduleName, newScheduleName) {
  await runSQL(
    userDB,
    'UPDATE tblSchedules SET ScheduleName=? WHERE ScheduleName=?;',
    [newScheduleName, curScheduleName],
  );
}

/**
 * Given a unique and existing name value updates the date value of the matching element in the database
 * @param {Database} userDB
 * @param {Date} date
 * @param {string} name - Unique name value corresponding to the item to be updated in the table
 * @param {Function} afterUpdate - A callback to be fired when the update has completed
 */
export async function updateDates(userDB, date, name, afterUpdate = () => {}) {
  await runSQL(userDB, 'UPDATE tblDates SET Date=? WHERE Name=?;', [
    date.toString(),
    name,
  ]).then(afterUpdate);
}

/**
 * Given a schedule name, returns the settings associated with it
 * @param {Database} userDB
 * @param {string} scheduleName
 * @returns {object}
 * @property {boolean} hideCompleted - True if user wants previously read reading portions to not be shown
 * @property {boolean} doesTrack - False if user wants completion dates of reading portions to not be shown
 */
export async function getScheduleSettings(userDB, scheduleName) {
  let activeDays = [];
  let creationInfo;
  let doesTrack;
  let hideCompleted;
  let startDate;

  let {rows} = await runSQL(
    userDB,
    'SELECT * FROM tblSchedules WHERE ScheduleName=?;',
    [scheduleName],
  );

  if (rows.length > 0) {
    let scheduleInfo = rows.item(0);
    for (let i = 0; i < 7; i++) {
      let dayIsActive = scheduleInfo[`IsDay${i}Active`] ? true : false;
      activeDays.push(dayIsActive);
    }
    creationInfo = JSON.parse(scheduleInfo.CreationInfo);
    doesTrack = scheduleInfo.DoesTrack ? true : false;
    hideCompleted = scheduleInfo.HideCompleted ? true : false;
    startDate = new Date(scheduleInfo.StartDate);
  }

  return {activeDays, creationInfo, doesTrack, hideCompleted, startDate};
}

/**
 * Given a schedule name, will update the value of the hide completed setting associated with it
 * @param {Database} userDB
 * @param {string} scheduleName
 * @param {boolean} value
 */
export async function setHideCompleted(userDB, scheduleName, value) {
  let hideCompleted = value ? 1 : 0;

  await runSQL(
    userDB,
    'UPDATE tblSchedules SET HideCompleted=? WHERE ScheduleName=?;',
    [hideCompleted, scheduleName],
  );
}

/**
 * Updates the "DoesTrack" value in the database for a schedule matching the given name
 * @param {Database} userDB
 * @param {string} scheduleName
 * @param {boolean} doesTrack
 */
export async function setDoesTrack(userDB, scheduleName, doesTrack) {
  let newDoesTrack = doesTrack ? 1 : 0;

  await runSQL(
    userDB,
    'UPDATE tblSchedules SET DoesTrack=? WHERE ScheduleName=?;',
    [newDoesTrack, scheduleName],
  );
}

/**
 * Given a schedule query result finds spans of continuous portions marked as finished in the table
 * @param {DBQueryResult} schedule
 * @param {integer} startIndex
 * @param {integer} endIndex
 * @returns {Array<object>} - An array of objects with startIndex and endIndex keys indicating the span of unbroken completed portions
 */
export function findFinishedPortionSpans(schedule, startIndex, endIndex) {
  let startID = schedule.rows.item(startIndex).ReadingDayID;
  let endID = schedule.rows.item(endIndex).ReadingDayID;
  let idDifference = endID - startID;
  let indexDifference = endIndex - startIndex;

  if (idDifference === indexDifference) {
    return [{startIndex, endIndex}];
  }

  let midIndex = Math.floor(startIndex + (endIndex - startIndex) / 2);

  let left = findFinishedPortionSpans(schedule, startIndex, midIndex);
  let right = findFinishedPortionSpans(schedule, midIndex + 1, endIndex);

  // Merge the last of the left with the first of the right if the IDs only differ by one, keep the rest
  let lastOfLeft = left[left.length - 1];
  let firstOfRight = right[0];
  let lastOfLeftID = schedule.rows.item(lastOfLeft.endIndex).ReadingDayID;
  let firstOfRightID = schedule.rows.item(firstOfRight.startIndex).ReadingDayID;

  if (lastOfLeftID === firstOfRightID - 1) {
    left.pop();
    right.shift();

    let mergedSpan = {
      startIndex: lastOfLeft.startIndex,
      endIndex: firstOfRight.endIndex,
    };
    return [...left, mergedSpan, ...right];
  }

  return [...left, ...right];
}

/**
 * Given a table name to search in and a set of verse info, finds the corresponding index in the table for the reading portion containing that verse
 * @param {Database} userDB
 * @param {string} tableName
 * @param {integer} bookNumber
 * @param {integer} chapter
 * @param {integer} verse
 * @returns {integer} - The corresponding index
 */
export async function findCorrespondingIndex(
  userDB,
  tableName,
  bookNumber,
  chapter,
  verse,
) {
  let correspondingIndex;

  await runSQL(
    userDB,
    `SELECT * 
     FROM ${tableName}
     WHERE (StartBookNumber<? 
              OR (StartBookNumber=? AND 
                    (StartChapter<? OR
                        (StartChapter=? AND StartVerse<=?)))
            )AND(
              EndBookNumber>?
              OR (EndBookNumber=? AND
                    (EndChapter>? OR
                        (EndChapter=? AND EndVerse>=?))));`,
    [
      bookNumber,
      bookNumber,
      chapter,
      chapter,
      verse,
      bookNumber,
      bookNumber,
      chapter,
      chapter,
      verse,
    ],
  ).then((res) => {
    if (res.rows.length > 0) {
      let item = res.rows.item(0);

      correspondingIndex = item.ReadingDayID - 1;
    }
  });

  return correspondingIndex;
}

/**
 * Given the name of an original table and a table to match with it will update the new table's corresponding IsFinished markers for the correct reading days
 * @param {Database} userDB
 * @param {string} origTableName
 * @param {string} newTableName
 */
export async function matchFinishedPortions(
  userDB,
  origTableName,
  newTableName,
) {
  let origScheduleFinished = await runSQL(
    userDB,
    `SELECT * FROM ${origTableName} WHERE IsFinished=1;`,
  );

  if (origScheduleFinished.rows.length < 1) return;

  let finishedSpans = findFinishedPortionSpans(
    origScheduleFinished,
    0,
    origScheduleFinished.rows.length - 1,
  );

  let updates = finishedSpans.map(async (span) => {
    let startPortion = origScheduleFinished.rows.item(span.startIndex);
    let endPortion = origScheduleFinished.rows.item(span.endIndex);

    let startIndex = await findCorrespondingIndex(
      userDB,
      newTableName,
      startPortion.StartBookNumber,
      startPortion.StartChapter,
      startPortion.StartVerse,
    );

    let endIndex = await findCorrespondingIndex(
      userDB,
      newTableName,
      endPortion.EndBookNumber,
      endPortion.EndChapter,
      endPortion.EndVerse,
    );

    // In order to make sure we don't somehow accidentally mark every item as read because of feeding
    // bad info into the next function
    if (startIndex > endIndex) {
      let tempStartIndex = startIndex;
      startIndex = endIndex;
      endIndex = tempStartIndex;
    }

    await updateMultipleReadStatus(
      userDB,
      newTableName,
      endIndex + 1,
      startIndex + 1,
    );
  });

  await Promise.all(updates);
}

/**
 * Checks if there is already a schedule with the given name and recursively checks a new name until finding one that doesn't exsits then returns the resulting string
 * @param {Database} userDB
 * @param {string} scheduleName
 * @param {number | undefined} itteration
 * @returns {string}
 */
async function createOldScheduleName(userDB, scheduleName, itteration) {
  let suffix = ` ${itteration}`;
  if (!itteration) {
    suffix = '';
    itteration = 0;
  }
  let newScheduleName = `${scheduleName} (${translate('old')}${suffix})`;

  let {rows} = await runSQL(
    userDB,
    'SELECT 1 FROM tblSchedules WHERE ScheduleName=?;',
    [newScheduleName],
  );

  if (rows.length > 0) {
    return createOldScheduleName(userDB, scheduleName, itteration + 1);
  }

  return newScheduleName;
}

/**
 *
 * @param {Database} userDB
 * @param {Database} bibleDB
 * @param {string} scheduleName
 * @param {object} creationInfo - Optional override values to implement in the new schedule
 * @property {boolean} creationInfo.doesTrack - Should the schedule keep track of the completion dates for reading days?
 * @property {Date} creationInfo.startDate - Date to start schedule generation from
 * @property {Array<(0|1)>} creationInfo.activeDays - A length 7 array of 1s or 0s. For future versions where the user can choose which weekdays they would like to read on and which weekdays to skip
 * @property {number} creationInfo.duration - The length (in years) the user wants the Bible reading schedule to last
 * @property {integer} creationInfo.bookId - The number of the Bible book the user chose to start from
 * @property {integer} creationInfo.chapter - The number of the Bible book the user chose to start from
 * @property {integer} creationInfo.verse - The number of the Bible book the user chose to start from
 * @property {number} creationInfo.startingPortion - (Must be between 0 and 1,000,000,000,000,000) The portion to begin the schedule from
 * @property {number} creationInfo.maxPortion - The number of the last portion in the publication
 * @property {string} creationInfo.readingPortionDesc - A user provided description of the sections to break up their reading by
 * @property {number} creationInfo.portionsPerDay - How many portions to read each day
 */
export async function recreateSchedule(
  userDB,
  bibleDB,
  scheduleName,
  creationInfo = {},
) {
  //Get old schedule info
  let oldScheduleInfo;
  await runSQL(userDB, 'SELECT * FROM tblSchedules WHERE ScheduleName=?;', [
    scheduleName,
  ]).then((res) => {
    oldScheduleInfo = res.rows.item(0);
  });

  let oldCreationInfo = JSON.parse(oldScheduleInfo.CreationInfo);

  //Change old schedule name
  let oldScheduleName = await createOldScheduleName(userDB, scheduleName);
  await renameSchedule(userDB, scheduleName, oldScheduleName);

  //Merge old schedule info with given schedule creation info
  let oldActiveDays = [];
  for (let i = 0; i < 7; i++) {
    oldActiveDays[i] = oldScheduleInfo[`IsDay${i}Active`];
  }

  let newCreationInfo = {
    ...oldCreationInfo,
    activeDays: oldActiveDays,
    doesTrack: oldScheduleInfo.DoesTrack,
    startDate: new Date(oldScheduleInfo.StartDate),
    ...creationInfo,
  };

  //Create new schedule with the original name
  let createSchedule = new Promise((res, rej) => {
    addSchedule(
      userDB,
      bibleDB,
      parseInt(oldScheduleInfo.ScheduleType, 10),
      scheduleName,
      newCreationInfo.doesTrack,
      newCreationInfo.activeDays,
      newCreationInfo.duration,
      newCreationInfo.bookId,
      newCreationInfo.chapter,
      newCreationInfo.verse,
      newCreationInfo.startingPortion,
      newCreationInfo.maxPortion,
      newCreationInfo.readingPortionDesc,
      newCreationInfo.portionsPerDay,
      res,
      console.error,
      newCreationInfo.startDate,
    );
  });

  await createSchedule;

  //Get schedule table info
  let oldTableName;
  let newTableName;
  await runSQL(
    userDB,
    'SELECT * FROM tblSchedules WHERE ScheduleName=? OR ScheduleName=?;',
    [oldScheduleName, scheduleName],
  ).then((res) => {
    for (let i = 0; i < res.rows.length; i++) {
      const item = res.rows.item(i);

      switch (item.ScheduleName) {
        case scheduleName:
          newTableName = formatScheduleTableName(item.ScheduleID);
          break;
        case oldScheduleName:
          oldTableName = formatScheduleTableName(item.ScheduleID);
          break;
        default:
          console.error('I have a bad feeling about this');
      }
    }
  });

  //Then we match to sync finished reading portions with old schedule
  await matchFinishedPortions(userDB, oldTableName, newTableName);
}
