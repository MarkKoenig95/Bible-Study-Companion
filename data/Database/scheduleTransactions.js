import {
  log,
  timeKeeper,
  searchQuery,
  createPlaceholdersFromArray,
  errorCB,
  formatDate,
  runSQL,
} from './generalTransactions';
import {translate} from '../../logic/localization/localization';
import {SCHEDULE_TYPES} from '../../components/popups/ScheduleTypeSelectionPopup';
import {
  WEEKLY_READING_TABLE_NAME,
  getWeeksBetween,
  getWeekdays,
} from '../../logic/logic';

const prefix = 'scheduleTransactions.';

/** @typedef {number} integer */

/**
 * @typedef VersePosition
 * @enum
 * @property {integer} [START=0] Indicates that the verse (or span of verses) includes the starting verse of the chapter
 * @property {integer} [MIDDLE=1] Indicates that the verse (or span of verses) does not include the starting or ending verse of the chapter
 * @property {integer} [END=2] Indicates that the verse (or span of verses) includes the ending verse of the chapter
 * @property {integer} [START_AND_END=3] Indicates that the verse (or span of verses) includes both the starting and ending verse of the chapter
 */
export const VERSE_POSITION = {START: 0, MIDDLE: 1, END: 2, START_AND_END: 3};

/**
 * The result from a query to the database
 * @typedef {object} DBQueryResult
 * @property {object} DBQueryResult.rows - The rows returned containing data matching the query
 * @property {integer} DBQueryResult.rows.length - The number of rows in the result
 * @property {Function} DBQueryResult.rows.item - Accepts an index and returns the item at that index
 */

/** @type {DBQueryResult} */
var qryMaxChapters;
/** @type {DBQueryResult} */
var qryMaxVerses;
/** @type {DBQueryResult} */
var tblVerseIndex;
/** @type {DBQueryResult} */
var qryChronologicalOrder;
/** @type {DBQueryResult} */
var qryChronologicalIndex;
/** @type {DBQueryResult} */
var qryThematicOrder;
/** @type {DBQueryResult} */
var qryThematicIndex;
/** @type {DBQueryResult} */
var qryThematicCount;
/** @type {DBQueryResult} */
let qryThematicLeastIndices;

//------------------------------------- Updating schedule info -------------------------------------

/**
 * Deletes a schedule from the database and the reference to such schedule in tblSchedules
 * @param {Database} db
 * @param {string} tableName - A string formatted from the function formatScheduleTableName
 * @param {string} scheduleName
 */
export async function deleteSchedule(db, tableName, scheduleName) {
  await runSQL(db, 'DELETE FROM tblSchedules WHERE ScheduleName=?;', [
    scheduleName,
  ]);

  await runSQL(db, `DROP TABLE IF EXISTS ${tableName};`).then(() => {
    console.log('Deleted table ', tableName);
  });
}

/**
 * Updates the read flag in a schedule table of a reading day item
 * @param {Database} db
 * @param {string} tableName - A string formatted from the function formatScheduleTableName
 * @param {integer} id - The reading day ID of the item to be updated
 * @param {boolean} status - The value to update the status to
 * @param {Function} afterUpdate - A callback to be fired when the update has completed
 */
export function updateReadStatus(db, tableName, id, status, afterUpdate) {
  let bool = status ? 1 : 0;

  runSQL(db, `UPDATE ${tableName} SET IsFinished=? WHERE ReadingDayID=?;`, [
    bool,
    id,
  ]).then(afterUpdate);
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

/** @param {integer} id */
export function formatScheduleTableName(id) {
  const tableName = 'tblSchedule' + id;

  return tableName;
}

/**
 * Given a schedule name, returns the settings associated with it
 * @param {Database} db
 * @param {string} scheduleName
 * @returns {object}
 * @property {boolean} hideCompleted - True if user wants previously read reading portions to not be shown
 * @property {boolean} doesTrack - False if user wants completion dates of reading portions to not be shown
 */
export async function getScheduleSettings(db, scheduleName) {
  let hideCompleted;
  let doesTrack;

  let result = await runSQL(
    db,
    'SELECT * FROM tblSchedules WHERE ScheduleName=?;',
    [scheduleName],
  );

  if (result.rows.length > 0) {
    hideCompleted = result.rows.item(0).HideCompleted ? true : false;
    doesTrack = result.rows.item(0).DoesTrack ? true : false;
  }

  return {doesTrack, hideCompleted};
}

/**
 * Given a schedule name, will update the value of the hide completed setting associated with it
 * @param {Database} db
 * @param {string} scheduleName
 * @param {boolean} value
 */
export async function setHideCompleted(db, scheduleName, value) {
  let hideCompleted = value ? 1 : 0;

  await runSQL(
    db,
    'UPDATE tblSchedules SET HideCompleted=? WHERE ScheduleName=?;',
    [hideCompleted, scheduleName],
  );
}

//-------------------------------------- Seting up needed info --------------------------------------
/**
 * Creates a mock query object based on the typical style of database fetches in order to
 * unify index calls between different table ordering schemes:
 * Chronological, Thematic, and Sequential
 *
 * The main point is to save storage space. Instead of having 3 copies of the same 31077 items
 * in tblVerseIndex we have the base query (tblVerseIndex)  which stores all of the relevant
 * information for the verse (Bible Book, Chapter, Verse number, etc.) and then 2 other
 * queries sorted according to their corresponding scheme (Chronological and Thematic) which
 * have a reference to the correct VerseID in the main table.
 *
 * @param {object} query a resulting query object from a database fetch result
 * @returns {object} a Mocked database fetch result which takes a sequential index, and
 *  returns the corresponding value from the tblVerseIndex table
 */
function createQryOrderIndex(query) {
  const item = i => {
    const index = query.rows.item(i).VerseID - 1;
    const result = tblVerseIndex.rows.item(index);

    return result;
  };
  const length = tblVerseIndex.rows.length;
  return {rows: {length: length, item: item}};
}

/**
 * Initializes query variables to be used in schedule creation
 * @param {Database} bibleDB
 */
export async function runQueries(bibleDB) {
  if (!tblVerseIndex) {
    tblVerseIndex = await runSQL(bibleDB, 'SELECT * FROM tblVerseIndex;');
  }

  if (!qryMaxVerses) {
    qryMaxVerses = await runSQL(bibleDB, 'SELECT * FROM qryMaxVerses;');
  }

  if (!qryMaxChapters) {
    qryMaxChapters = await runSQL(bibleDB, 'SELECT * FROM qryMaxChapters;');
  }

  if (!qryChronologicalOrder) {
    qryChronologicalOrder = await runSQL(
      bibleDB,
      'SELECT * FROM qryChronologicalOrder;',
    );
    qryChronologicalIndex = createQryOrderIndex(qryChronologicalOrder);
  }

  if (!qryThematicOrder) {
    qryThematicOrder = await runSQL(bibleDB, 'SELECT * FROM qryThematicOrder;');
    qryThematicIndex = createQryOrderIndex(qryThematicOrder);
  }

  if (!qryThematicCount) {
    qryThematicCount = await runSQL(bibleDB, 'SELECT * FROM qryThematicCount;');
  }

  if (!qryThematicLeastIndices) {
    qryThematicLeastIndices = await runSQL(
      bibleDB,
      'SELECT * FROM qryThematicLeastIndices;',
    );
  }

  return {
    tblVerseIndex,
    qryChronologicalIndex,
    qryChronologicalOrder,
    qryMaxChapters,
    qryMaxVerses,
    qryThematicCount,
    qryThematicIndex,
    qryThematicLeastIndices,
    qryThematicOrder,
  };
}

//---------------------------------------- Creating schedules ----------------------------------------
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
) {
  log(
    `______________________ New Schedule named ${scheduleName} ______________________`,
  );
  timeKeeper('Started at...');
  if (
    !qryMaxVerses ||
    !tblVerseIndex ||
    !qryChronologicalOrder ||
    !qryThematicOrder ||
    !qryThematicCount
  ) {
    await runQueries(bibleDB);
  }

  let scheduleNameExists;
  let tableName;
  let creationInfo;

  //Check if a schedule with that name already exists
  await runSQL(userDB, 'SELECT 1 FROM tblSchedules WHERE ScheduleName=?;', [
    scheduleName,
  ]).then(res => {
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

  if (!scheduleNameExists) {
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
          CreationInfo,
          IsDay0Active,
          IsDay1Active,
          IsDay2Active,
          IsDay3Active,
          IsDay4Active,
          IsDay5Active,
          IsDay6Active)
          VALUES (?, 0, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?);`,
      [
        scheduleName,
        doesTrack,
        scheduleType,
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
    ).then(res => {
      let id = res.rows.item(0).ScheduleID;
      tableName = formatScheduleTableName(id);

      log('Creating table for schedule', scheduleName, 'named', tableName);
    });

    await createScheduleTable(userDB, tableName, scheduleType);

    //Populate the table with reading information
    if (scheduleType !== SCHEDULE_TYPES.CUSTOM) {
      generateBibleSchedule(
        userDB,
        bibleDB,
        scheduleType,
        duration,
        bookId,
        chapter,
        verse,
        tableName,
        successCallBack,
        errorCallBack,
      );
    } else {
      generateCustomSchedule(
        userDB,
        tableName,
        startingPortion,
        maxPortion,
        readingPortionDesc,
        portionsPerDay,
        successCallBack,
      );
    }
  } else {
    errorCallBack(translate('prompts.nameTaken'));
  }
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

    let versesPerDay = Math.floor(weeklyReadingInfo.rows.length / 7);
    let pointer = 0;
    let portions = [];
    let dayStartPosition;
    let dayEndPosition;

    for (let i = 0; i < 7; i++) {
      dayStartPosition = i === 0 ? VERSE_POSITION.START : VERSE_POSITION.MIDDLE;
      dayEndPosition = i === 6 ? VERSE_POSITION.END : VERSE_POSITION.MIDDLE;
      let dayStartIndex = pointer;
      pointer += versesPerDay;
      let dayEndIndex = pointer;

      if (dayEndIndex > weeklyReadingInfo.rows.length - 1 || i >= 6) {
        dayEndIndex = weeklyReadingInfo.rows.length - 1;
      }

      log('day', i, 'dayStartIndex', dayStartIndex, 'dayEndIndex', dayEndIndex);

      let temp = createReadingPortion(
        weeklyReadingInfo,
        dayStartIndex,
        dayStartPosition,
        dayEndIndex,
        dayEndPosition,
        date,
      );
      portions.push(temp);

      date.setDate(date.getDate() + 1);
      pointer++;
    }

    await insertReadingPortions(
      userDB,
      portions,
      tableName,
      bibleScheduleValuesArray,
    )
      .then(wasSucessful => {
        if (wasSucessful) {
          console.log('Every insert was successful');
        } else {
          console.log('Insert failed');
        }
      })
      .catch(err => {
        errorCB(err);
      });

    timeKeeper('Ended after creating table at.....');
  } else {
    timeKeeper('Ended after doing nothing at.....');
  }
}

//------------------------------ Searching for indexes based on values ------------------------------
/**
 * Given a Bible book returns the largest chapter for it
 * @param {integer} bookId
 * @returns {integer}
 */
export function findMaxChapter(bookId) {
  let index = searchQuery(qryMaxChapters, 'BibleBook', bookId);

  return qryMaxChapters.rows.item(index).MaxChapter;
}

/**
 * Given a Bible book and chapter returns the largest verse for it
 * @param {integer} bookId
 * @param {integer} chapter
 * @returns {integer}
 */
export function findMaxVerse(bookId, chapter) {
  let index = searchQuery(
    qryMaxVerses,
    'BibleBook',
    bookId,
    'Chapter',
    chapter,
  );

  return qryMaxVerses.rows.item(index).MaxVerse;
}

/**
 * Given a Bible book, chapter, and verse returns the information for the closest matching result in the Bible
 * @param {integer} bookId
 * @param {integer} chapter
 * @param {integer} verse
 * @returns {Array<integer>} [bookId, chapter, verse]
 */
export function findNearestVerse(bookId, chapter, verse) {
  let index = 0;

  log('bookId:', bookId, 'chapter:', chapter, 'verse:', verse);

  let maxChapter = findMaxChapter(bookId);

  if (chapter > maxChapter) {
    let maxBook = 66;
    bookId++;
    bookId = bookId % maxBook;
    chapter = 1;
    verse = 1;
  }

  index = searchQuery(qryMaxVerses, 'BibleBook', bookId, 'Chapter', chapter);

  let verseAtIndex = qryMaxVerses.rows.item(index).MaxVerse;

  if (verse > verseAtIndex) {
    index++;
    verse = 1;
  }

  chapter = qryMaxVerses.rows.item(index).Chapter;
  bookId = qryMaxVerses.rows.item(index).BibleBook;

  return [bookId, chapter, verse];
}

/**
 * Given the information for a verse returns the index for the correlative item in the database
 * @param {Database} bibleDB
 * @param {integer} bookId
 * @param {integer} chapter
 * @param {integer} verse
 * @param {ScheduleType} scheduleType
 * @param {boolean} [isFirstTime=false]
 */
export async function findVerseIndex(
  bibleDB,
  bookId,
  chapter,
  verse,
  scheduleType,
  isFirstTime,
) {
  let index = 0;
  let found;

  //Find index in table for specific verse
  await runSQL(
    bibleDB,
    `SELECT VerseID 
       FROM tblVerseIndex 
       WHERE BibleBook=? AND Chapter=? AND Verse=?;`,
    [bookId, chapter, verse],
  ).then(res => {
    if (res.rows.length > 0) {
      //The verse searched for exists
      found = true;
      index = res.rows.item(0).VerseID;
    }
  });

  log('isFirstTime', isFirstTime);

  //If there is no such verse, then we have to adjust
  //(Make sure the recurssive call only runs once too)
  if (!found && isFirstTime) {
    //First check if the chapter is out of bounds and adjust. This makes later processses easier
    let maxChapter = findMaxChapter(bookId);

    if (chapter > maxChapter) {
      let maxBook = 66;
      bookId++;
      bookId = bookId % maxBook;
      chapter = 1;
      verse = 1;
    }

    //Find the verse which most closely matches the one which was requested
    let nearestVerse = findNearestVerse(bookId, chapter, verse);

    log('Nearest verse:', ...nearestVerse);

    //With a new adjusted verse let's search again to see what the index for this verse is
    index = await findVerseIndex(bibleDB, ...nearestVerse, scheduleType);
  }

  if (isFirstTime) {
    let queryOrView = '';
    let indexKey = '';
    switch (scheduleType) {
      case SCHEDULE_TYPES.SEQUENTIAL:
        queryOrView = 'tblVerseIndex';
        indexKey = 'VerseID';
        break;
      case SCHEDULE_TYPES.CHRONOLOGICAL:
        queryOrView = 'qryChronologicalOrder';
        indexKey = 'RowNum';
        break;
      case SCHEDULE_TYPES.THEMATIC:
        queryOrView = 'qryThematicOrder';
        indexKey = 'RowNum';
        break;
      default:
        console.log('Schedule Type was not defined');
        break;
    }
    await runSQL(bibleDB, `SELECT * FROM ${queryOrView} WHERE VerseID=?;`, [
      index,
    ]).then(res => {
      index = res.rows.item(0)[indexKey] - 1;
    });
  }

  return index;
}

//----------------------------- Setting up values for schedule creation -----------------------------

function setQryVerseIndex(scheduleType) {
  let tempQuery;
  switch (scheduleType) {
    case SCHEDULE_TYPES.SEQUENTIAL:
      tempQuery = tblVerseIndex;
      break;
    case SCHEDULE_TYPES.CHRONOLOGICAL:
      tempQuery = qryChronologicalIndex;
      break;
    case SCHEDULE_TYPES.THEMATIC:
      tempQuery = qryThematicIndex;
      break;
    default:
      console.log('Schedule Type was not defined');
      break;
  }
  return tempQuery;
}

/**
 * Given schedule creation information returns
 * @param {number} dur - The number of years the schedule will last for
 * @param {DBQueryResult} qryVerseIndex
 * @param {ScheduleType} scheduleType
 * @returns {object}
 * @property {Array<string>} keys - Keys (day of a schedule) used to access other returned objects
 * @property {number} duration - Number of days the schedule will last for
 * @property {object} leastIndex - Smallest index for the given key (day) of the schedule
 * @property {object} maxIndex - Largest index for the given key (day) of the schedule
 * @property {object} versesPerDay - How many verses should be read for the given key (day) of the schedule
 * @property {object} buffer - Acceptable number of verses to be subtracted or added to the amount of verses for the day in order to adjust to a cleaner value (ex. the begining of a chapter)
 */
export function setScheduleParameters(dur, qryVerseIndex, scheduleType) {
  dur = parseFloat(dur, 10);

  //Transform the duration into an amount of days based on the years given by user
  const duration = dur * 365 + dur * 7;
  /* Apparently, (I assume because of truncating of decimal places) the schedules get farther
    and farther off target the more years they run, thus the "+ duration * 7" adjustment.
    It matches the target numbers well even all the way up to a 7 year schedule. */

  let leastIndex = {};
  let maxIndex = {};
  let versesPerDay = {};
  let buffer = {};
  let keys = [];

  if (scheduleType !== SCHEDULE_TYPES.THEMATIC) {
    let totalVerses = qryVerseIndex.rows.length;
    let value = totalVerses / duration;
    keys[0] = '1';
    leastIndex[keys[0]] = 0;
    maxIndex[keys[0]] = totalVerses - 1;
    versesPerDay[keys[0]] = value;
    buffer[keys[0]] = Math.round(versesPerDay[keys[0]] / 4);
  } else {
    let tempDur = duration / 7 - dur * 0.5;

    /* qryThematicCount is a count of the number of verses with each corresponding day value 1 - 7
      This way we can keep track of each themed day of the week with the different pointers
      as well as knowing what the minimum and maximum verse indexes are for each theme */
    for (let k = 0; k < qryThematicCount.rows.length; k++) {
      const element = qryThematicCount.rows.item(k);
      let totalVerses = element.Count;
      keys[k] = element.ThematicOrder;
      leastIndex[keys[k]] = qryThematicLeastIndices.rows.item(k).LeastIndex - 1;
      maxIndex[keys[k]] = leastIndex[keys[k]] + totalVerses - 1;
      versesPerDay[keys[k]] = Math.floor(totalVerses / tempDur);
      buffer[keys[k]] = Math.round(versesPerDay[keys[k]] / 4);
    }
  }

  return {
    keys: keys,
    duration: duration,
    leastIndex: leastIndex,
    maxIndex: maxIndex,
    versesPerDay: versesPerDay,
    buffer: buffer,
  };
}

/**
 * Initializes mutable objects and arrays which will be used in schedule creation
 * @param {Database} bibleDB
 * @param {DBQueryResult} qryVerseIndex
 * @param {integer} requestedIndex - The index which the user has selected, or which has been adjusted to the nearest existing value to it
 * @param {Array} keys - An array of keys corresponding to each section of a schedule
 * @param {object} leastIndex - An object with keys corresponding to the smallest index for each section of a schedule
 * @param {object} maxIndex - An object with keys corresponding to the largest index for each section of a schedule
 */
export async function setTrackers(
  bibleDB,
  qryVerseIndex,
  requestedIndex,
  keys,
  leastIndex,
  maxIndex,
) {
  let pointer = {};
  let endIndex = {};
  let hasLooped = {};
  let isEnd = {};
  let verseOverflow = {};
  let keyIndex;

  if (keys.length === 1) {
    keyIndex = 0;
    let key = keys[keyIndex];
    pointer[key] = requestedIndex;
    endIndex[key] = requestedIndex - 1;
    hasLooped[key] = false;
    isEnd[key] = false;
    verseOverflow[key] = 0;
  } else {
    //We have a schedule with multiple types of days
    let startKey;

    await runSQL(bibleDB, 'SELECT * FROM qryThematicOrder WHERE VerseID=?;', [
      requestedIndex + 1,
    ]).then(res => {
      startKey = res.rows.item(0).ThematicOrder - 1;
    });

    let key = keys[startKey];
    //Set accurate start index for theme corresponding to selected start verse
    pointer[key] = requestedIndex;
    endIndex[key] = requestedIndex - 1;
    hasLooped[key] = false;
    isEnd[key] = false;
    verseOverflow[key] = 0;

    let isEvenStart = qryVerseIndex.rows.item(requestedIndex).Verse === 1;

    //Find a correlative start position for each other theme of the schedule
    let currentPosition = requestedIndex - leastIndex[key];
    let maxPosition = maxIndex[key] - leastIndex[key];
    let ratioToStart = currentPosition / maxPosition;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (i !== startKey) {
        let indexStart = leastIndex[key];
        let indexEnd = maxIndex[key];
        let approxPosition = Math.round((indexEnd - indexStart) * ratioToStart);
        let tempPointer = indexStart + approxPosition;
        if (tempPointer < indexEnd) {
          tempPointer = isEvenStart
            ? tempPointer - qryVerseIndex.rows.item(tempPointer).Verse + 1
            : tempPointer;
        } else {
          tempPointer = indexStart;
        }
        pointer[key] = tempPointer;
        endIndex[key] = pointer[key] - 1;
        hasLooped[key] = false;
        isEnd[key] = false;
        verseOverflow[key] = 0;
      } else {
        keyIndex = i;
      }
    }
  }

  return {
    pointer,
    keyIndex,
    endIndex,
    hasLooped,
    isEnd,
    verseOverflow,
  };
}

/**
 * Checks if verse at index chosen by algorithm matches the verse given by the user.
 * If not returns a string detailing the adjustment in order to inform the user.
 * If no difference returns nothing (undefined)
 * @param {DBQueryResult} qryVerseIndex
 * @param {string} bibleBookPrefix - The first part of the key relating to the location of the translation string for a book name
 * @param {string} bibleBookSuffix - The last part of the key relating to the location of the translation string for a book name
 * @param {integer} bookId
 * @param {integer} chapter
 * @param {integer} verse
 * @param {integer} pointer - The index which our create bible schedule algorithm decided on
 * @returns {(undefined|string)}
 */
export function setAdjustedMessage(
  bibleBookPrefix,
  bibleBookSuffix,
  bookId,
  chapter,
  verse,
  qryVerseIndex,
  pointer,
) {
  let adjustedVerseMessage;

  let initialBibleBook = translate(bibleBookPrefix + bookId + bibleBookSuffix);
  let initialChapter = chapter;
  let initialVerse = verse;

  let startBookNumber = qryVerseIndex.rows.item(pointer).BibleBook;
  let startBibleBook = translate(
    bibleBookPrefix + startBookNumber + bibleBookSuffix,
  );
  let startChapter = qryVerseIndex.rows.item(pointer).Chapter;
  let startVerse = qryVerseIndex.rows.item(pointer).Verse;

  if (
    startBibleBook != initialBibleBook ||
    startChapter != initialChapter ||
    startVerse != initialVerse
  ) {
    adjustedVerseMessage = translate(prefix + 'adjustedVersePrompt', {
      initialBibleBook: initialBibleBook,
      initialChapter: initialChapter,
      initialVerse: initialVerse,
      startBibleBook: startBibleBook,
      startChapter: startChapter,
      startVerse: startVerse,
    });
  }

  return adjustedVerseMessage;
}

//---------------------------------- For use in creating schedules ----------------------------------
/**
 * Returns an index adjustment for a value in the given query which marks a clean demarcation for a reading
 * (ex. the end of a chapter) within a range +- the given buffer if one is found, otherwise returns zero
 * @requires qryVerseIndex to be a sequential table reference
 * @param {DBQueryResult} qryVerseIndex
 * @param {integer} checkIndex - The current index in the query to check against
 * @param {integer} buffer - An acceptable range of verses + or - the index to check against
 * @returns {integer} the adjustment, which when added to the original index gives the new index
 */
export function checkOrderedVerseBuffer(qryVerseIndex, checkIndex, buffer) {
  let endPortion = qryVerseIndex.rows.item(checkIndex);
  let endBook = endPortion.BibleBook;
  let endChapter = endPortion.Chapter;
  let endVerse = endPortion.Verse;

  if (endVerse < buffer) {
    return 0 - endVerse;
  }

  let maxVerse = findMaxVerse(endBook, endChapter);

  let difference = maxVerse - endVerse;
  if (difference < buffer) {
    return difference;
  }
  return 0;
}

/**
 * Returns an index adjustment for a value in the given query which marks a clean demarcation for a reading
 * (ex. the end of a chapter) within a range +- the given buffer if one is found, otherwise returns zero
 * @param {DBQueryResult} qryVerseIndex
 * @param {integer} checkIndex - The current index in the query to check against
 * @param {integer} buffer - An acceptable range of verses + or - the index to check against
 * @param {integer} maxIndex - The largest index for the current portion of the schedule
 * @param {integer} leastIndex - The smallest index for the current portion of the schedule
 * @returns {integer} the adjustment, which when added to the original index gives the new index
 */
export function checkAnyVerseBuffer(
  qryVerseIndex,
  checkIndex,
  buffer,
  maxIndex,
  leastIndex,
) {
  let checkPortion = qryVerseIndex.rows.item(checkIndex);
  let checkBook = checkPortion.BibleBook;
  let checkChapter = checkPortion.Chapter;

  log(
    'Checking',
    checkBook,
    'chapter',
    checkChapter,
    'verse',
    checkPortion.Verse,
  );

  let comparison = (i, endValue) => {
    if (endValue < 0) {
      return i > endValue;
    } else {
      return i < endValue;
    }
  };

  let checker = endValue => {
    let isSame = false;
    let tracker;
    let adj = 0;

    if (endValue > 0) {
      tracker = 1;
    } else if (endValue < 0) {
      tracker = -1;
    } else {
      return 0;
    }

    for (let i = tracker; comparison(i, endValue); i += tracker) {
      let currentIndex = checkIndex + i;
      if (currentIndex > maxIndex) {
        i = maxIndex - checkIndex;
        endValue = i - 1;
      }
      if (currentIndex < leastIndex) {
        break;
      }
      let currentPortion = qryVerseIndex.rows.item(checkIndex + i);
      let currentBook = currentPortion.BibleBook;
      let currentChapter = currentPortion.Chapter;
      isSame = currentBook === checkBook && currentChapter === checkChapter;

      if (isSame) {
        adj = i;
      } else {
        if (adj !== 0) {
          break;
        }
      }
    }
    return isSame ? 210 : adj;
  };

  log('checking max adjustment');

  //Check the upper bound
  let maxAdj = checker(buffer + 1);

  log('max adjustment = ', maxAdj);

  log('checking min adjustment');

  //Check the lower bound
  let minAdj = checker(0 - buffer - 1) - 1;

  log('min adjustment = ', minAdj);

  let adjustment = maxAdj < Math.abs(minAdj) ? maxAdj : minAdj;

  adjustment = adjustment < 200 ? adjustment : 0;

  log('overal adjustment = ', adjustment);

  let adjPortion = qryVerseIndex.rows.item(checkIndex + adjustment);
  log(
    'Adjusted from',
    checkBook,
    checkChapter,
    ':',
    checkPortion.Verse,
    'to',
    adjPortion.BibleBook,
    adjPortion.Chapter,
    ':',
    adjPortion.Verse,
  );

  return adjustment;
}

/**
 * Given information for a verse returns whether or not the given verse is the start of its chapter
 * @param {integer} bookId
 * @param {integer} chapter
 * @param {integer} verse
 * @returns {boolean}
 */
export function checkStartVerse(bookId, chapter, verse) {
  let isStart = false;
  if (bookId === 43 && chapter === 8) {
    if (verse === 12) {
      isStart = true;
    }
  } else if (verse === 1) {
    isStart = true;
  }
  return isStart;
}

/**
 * Given a start index and an end index returns whether they are the start and end of their verse span
 * @param {DBQueryResult} qryVerseIndex
 * @param {integer} startIndex - First index for a verse span
 * @param {integer} endIndex - Last index for a verse span
 * @returns {object} Keys = {startPosition, endPosition}
 * @property {VersePosition} startPosition
 * @property {VersePosition} endPosition
 */
export function checkStartAndEndPositions(qryVerseIndex, startIndex, endIndex) {
  let endBookId = qryVerseIndex.rows.item(endIndex).BibleBook;
  let endChapter = qryVerseIndex.rows.item(endIndex).Chapter;
  let endVerse = qryVerseIndex.rows.item(endIndex).Verse;
  let startBookId = qryVerseIndex.rows.item(startIndex).BibleBook;
  let startChapter = qryVerseIndex.rows.item(startIndex).Chapter;
  let startVerse = qryVerseIndex.rows.item(startIndex).Verse;
  let start = VERSE_POSITION.START;
  let middle = VERSE_POSITION.MIDDLE;
  let end = VERSE_POSITION.END;
  log(
    'startBookId',
    startBookId,
    'startChapter',
    startChapter,
    'startVerse',
    startVerse,
    'endBookId',
    endBookId,
    'endChapter',
    endChapter,
    'endVerse',
    endVerse,
  );

  let startPosition = checkStartVerse(startBookId, startChapter, startVerse)
    ? start
    : middle;

  let maxVerse = findMaxVerse(endBookId, endChapter);
  let endPosition = endVerse === maxVerse ? end : middle;

  return {startPosition: startPosition, endPosition: endPosition};
}

/**
 * Given start and and values returns the correct VERSE_POSITION value for a verse or verse span
 * @param {boolean} isStart
 * @param {boolean} isEnd
 * @returns {VersePosition}
 */
export function checkResultPosition(isStart, isEnd) {
  if (isStart && isEnd) {
    return VERSE_POSITION.START_AND_END;
  } else if (isStart || isEnd) {
    if (isStart) {
      return VERSE_POSITION.START;
    } else {
      return VERSE_POSITION.END;
    }
  } else {
    return VERSE_POSITION.MIDDLE;
  }
}

/**
 * Given the information for the start and end of a reading portion returns a consolidated string detailing
 * the verse span and a position of the verse span relative to the chapter
 * @param {string} startBook - The name of the start book
 * @param {string} endBook - The name of the end book
 *
 * @returns {object} keys = {description, position}
 * @property {string} description - Details the span of verses to be read
 * @property {VersePosition} position - An identifier detaling the location of the entire reading relative to the chapter
 *
 * @param {integer} startChapter
 * @param {integer} startVerse
 * @param {boolean} isStart
 * @param {integer} endChapter
 * @param {integer} endVerse
 * @param {boolean} isEnd
 */
export function checkReadingPortion(
  startBook,
  startChapter,
  startVerse,
  isStart,
  endBook,
  endChapter,
  endVerse,
  isEnd,
) {
  let resultPosition = checkResultPosition(isStart, isEnd);
  let isStartAndEnd = resultPosition === VERSE_POSITION.START_AND_END;
  let resultString;

  if (startBook === endBook) {
    if (startChapter === endChapter) {
      if (startVerse === endVerse) {
        // Here we have the same book, chapter, and verse
        // This means we only have one verse
        resultString = `${startBook} ${startChapter}:${startVerse}`;
      } else if (isStartAndEnd) {
        // Here we have the same book, chapter, and different verses
        // Since the positions of the verses are start and end, then this includes the entire chapter
        resultString = `${startBook} ${startChapter}`;
      } else {
        // Here we have the same book, chapter, and different verses
        // Since the position of one of these verses is in the middle we elaborate the verses to be read
        resultString = `${startBook} ${startChapter}:${startVerse}-${endVerse}`;
      }
    } else if (isStartAndEnd) {
      // Here we have the same book and different chapters
      // Since the positions of the verses are start and end, then this includes the entire span of chapters
      resultString = `${startBook} ${startChapter}-${endChapter}`;
    } else {
      // Here we have the same book and different chapters
      // Since the position of one of these verses is in the middle we elaborate the verses to be read
      resultString = `${startBook} ${startChapter}:${startVerse}-${endChapter}:${endVerse}`;
    }
  } else if (isStartAndEnd) {
    // Here we have the different books
    // Since the positions of the verses are start and end, then this includes the entire span of chapters
    resultString = `${startBook} ${startChapter}-${endBook} ${endChapter}`;
  } else {
    // Here we have the different books
    // Since the position of one of these verses is in the middle we elaborate the verses to be read
    resultString = `${startBook} ${startChapter}:${startVerse}-${endBook} ${endChapter}:${endVerse}`;
  }
  return {description: resultString, position: resultPosition};
}

/**
 * Takes tracking variables and determines whether adjustments need to be made to them, then returns the adjustments
 * @param {DBQueryResult} qryVerseIndex
 * @param {integer} dayEndIndex
 * @param {integer} maxIndex
 * @param {integer} leastIndex
 * @param {integer} endIndex
 * @param {number} verseOverflow
 * @param {boolean} hasLooped
 * @param {integer} buffer
 * @param {boolean} isEnd
 * @param {ScheduleType} scheduleType
 *
 * @returns {object} result
 * @property {integer} result.dayEndIndex - Adjusted index for the end of this reading day
 * @property {boolean} result.isEnd - Flag indicating if we have reached the end of the schedule (for this key at least)
 * @property {boolean} result.hasLooped - Flag indicating if we have passed the largest index and returned to the smallest index
 * @property {number} result.verseOverflow - Adjusted value keeping track of whether we should subtract verses from the next day or add to it
 */
export function checkEnd(
  qryVerseIndex,
  dayEndIndex,
  maxIndex,
  leastIndex,
  endIndex,
  verseOverflow,
  hasLooped,
  buffer,
  isEnd,
  scheduleType,
) {
  let checker = (
    hasLooped,
    dayEndIndex,
    maxIndex,
    leastIndex,
    endIndex,
    buffer,
  ) => {
    let isEnd = false;

    // Check the case where we go from the maximum index back to the least index for the given schedule
    // (ex. from 31077 back to 0) then we set the hasLooped flag to indicate for future checks
    if (!hasLooped) {
      if (dayEndIndex >= maxIndex) {
        dayEndIndex = dayEndIndex - maxIndex + leastIndex;
        hasLooped = true;

        if (dayEndIndex >= endIndex - buffer) {
          dayEndIndex = endIndex;
          isEnd = true;
        }
      }
    } else {
      if (dayEndIndex >= endIndex - buffer) {
        dayEndIndex = endIndex;
        isEnd = true;
      }
    }

    let index = dayEndIndex;
    let endFlag = isEnd;
    let loopFlag = hasLooped;

    return {index, endFlag, loopFlag};
  };

  // Check the current value to see whether we have reached the maximum value index for the current
  // schedule type and will need to loop, or if we have reached the last index for the whole schedule
  let checkResult = checker(
    hasLooped,
    dayEndIndex,
    maxIndex,
    leastIndex,
    endIndex,
    buffer,
  );
  dayEndIndex = checkResult.index;
  isEnd = checkResult.endFlag;
  hasLooped = checkResult.loopFlag;

  if (!isEnd) {
    let checkVerseBuffer;
    switch (scheduleType) {
      case SCHEDULE_TYPES.SEQUENTIAL:
        checkVerseBuffer = checkOrderedVerseBuffer;
        break;
      case SCHEDULE_TYPES.CHRONOLOGICAL:
        checkVerseBuffer = checkAnyVerseBuffer;
        break;
      case SCHEDULE_TYPES.THEMATIC:
        checkVerseBuffer = checkAnyVerseBuffer;
        break;
      default:
        console.log('Schedule Type was not defined');
        break;
    }

    let verseBuffer = checkVerseBuffer(
      qryVerseIndex,
      dayEndIndex,
      buffer,
      maxIndex,
      leastIndex,
    );

    verseOverflow -= verseBuffer;

    dayEndIndex += Math.round(verseBuffer);
  }

  checkResult = checker(
    hasLooped,
    dayEndIndex,
    maxIndex,
    leastIndex,
    endIndex,
    buffer,
  );
  dayEndIndex = checkResult.index;
  isEnd = isEnd || checkResult.endFlag;
  hasLooped = hasLooped || checkResult.loopFlag;

  if (dayEndIndex < leastIndex || dayEndIndex > maxIndex) {
    dayEndIndex = maxIndex;
  }

  return {
    dayEndIndex,
    isEnd,
    hasLooped,
    verseOverflow,
  };
}

// Declaring values to be input into schedule table here for easier understanding of structure.
// Values to be used later in schedule generator
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

/**
 * Takes values for a schedule reading day and returns an array of values for use in a database transaction
 * @param {string} startBookName
 * @param {integer} startBookNumber
 * @param {integer} startChapter
 * @param {integer} startVerse
 * @param {string} endBookName
 * @param {integer} endBookNumber
 * @param {integer} endChapter
 * @param {integer} endVerse
 * @param {Date} date
 * @param {string} description
 * @param {VersePosition} versePosition
 * @returns {Array} An array of the given values in the correct order
 */
function createReadingPortionArray(
  startBookName,
  startBookNumber,
  startChapter,
  startVerse,
  endBookName,
  endBookNumber,
  endChapter,
  endVerse,
  date,
  description,
  versePosition,
) {
  let result = [];

  //StartBookName
  result.push(startBookName);

  //StartBookNumber
  result.push(startBookNumber);

  //StartChapter
  result.push(startChapter);

  //StartVerse
  result.push(startVerse);

  //EndBookName
  result.push(endBookName);

  //EndBookNumber
  result.push(endBookNumber);

  //EndChapter
  result.push(endChapter);

  //EndVerse
  result.push(endVerse);

  //CompletionDate
  result.push(formatDate(date));

  //ReadingPortion
  result.push(description);

  //VersePosition
  result.push(versePosition);

  return result;
}

// Declaring values to be input into schedule table here for easier understanding of structure.
// Values to be used later in schedule generator
const customScheduleValuesArray = ['CompletionDate', 'ReadingPortion'];

function createCustomReadingPortionArray(date, description) {
  let result = [];

  //CompletionDate
  result.push(formatDate(date));

  //ReadingPortion
  result.push(description);

  return result;
}

/**
 * Given result values for a reading portion calls other helper functions to create a final array of values for insertion into schedule
 * @param {DBQueryResult} qryVerseIndex
 * @param {integer} dayStartIndex
 * @param {VersePosition} dayStartPosition
 * @param {integer} dayEndIndex
 * @param {VersePosition} dayEndPosition
 * @param {Date} date
 * @returns {Array}
 */
export function createReadingPortion(
  qryVerseIndex,
  dayStartIndex,
  dayStartPosition,
  dayEndIndex,
  dayEndPosition,
  date,
) {
  let startBookNumber;
  let startBookName;
  let startChapter;
  let startVerse;
  let isStart;
  let endBookNumber;
  let endBookName;
  let endChapter;
  let endVerse;
  let isEnd;
  const bibleBookPrefix = 'bibleBooks.';
  const bibleBookSuffix = '.name';

  log('dayStartPosition', dayStartPosition, 'dayEndPosition', dayEndPosition);

  isStart = dayStartPosition !== VERSE_POSITION.MIDDLE;
  isEnd = dayEndPosition !== VERSE_POSITION.MIDDLE;

  startBookNumber = qryVerseIndex.rows.item(dayStartIndex).BibleBook;
  startBookName = translate(
    bibleBookPrefix + startBookNumber + bibleBookSuffix,
  );
  startChapter = qryVerseIndex.rows.item(dayStartIndex).Chapter;
  startVerse = qryVerseIndex.rows.item(dayStartIndex).Verse;

  endBookNumber = qryVerseIndex.rows.item(dayEndIndex).BibleBook;
  endBookName = translate(bibleBookPrefix + endBookNumber + bibleBookSuffix);
  endChapter = qryVerseIndex.rows.item(dayEndIndex).Chapter;
  endVerse = qryVerseIndex.rows.item(dayEndIndex).Verse;

  const {description, position} = checkReadingPortion(
    startBookName,
    startChapter,
    startVerse,
    isStart,
    endBookName,
    endChapter,
    endVerse,
    isEnd,
  );

  log(
    `${startBookName} ${startChapter}:${startVerse} - ${endBookName} ${endChapter}:${endVerse}`,
    'displayed as',
    description,
  );

  let portion = createReadingPortionArray(
    startBookName,
    startBookNumber,
    startChapter,
    startVerse,
    endBookName,
    endBookNumber,
    endChapter,
    endVerse,
    date,
    description,
    position,
  );

  return portion;
}

/**
 * Given result values for a reading day calls other helper functions to create a final array of reading portion array values for insertion into schedule
 * @param {DBQueryResult} qryVerseIndex
 * @param {integer} dayStartIndex
 * @param {integer} dayEndIndex
 * @param {Date} date
 * @param {ScheduleType} scheduleType
 * @param {integer} leastIndex
 * @param {integer} maxIndex
 * @returns {Array<Array>}
 */
export function createReadingPortions(
  qryVerseIndex,
  dayStartIndex,
  dayEndIndex,
  date,
  scheduleType,
  leastIndex,
  maxIndex,
) {
  let portions = [];
  let portionsToSort = [];

  //If this is a sequential schedule we can rest assured that everything is in order of VerseID
  //and automatically return the reading portion array
  if (scheduleType === SCHEDULE_TYPES.SEQUENTIAL) {
    let {startPosition, endPosition} = checkStartAndEndPositions(
      qryVerseIndex,
      dayStartIndex,
      dayEndIndex,
    );

    let temp = createReadingPortion(
      qryVerseIndex,
      dayStartIndex,
      startPosition,
      dayEndIndex,
      endPosition,
      date,
    );
    portions.push(temp);
    return portions;
  }

  //Otherwise we need to run through the whole day's reading, find when the reading changes position
  //relative to the order in the bible, and then sort and condense the resulting arrays to clean up
  let addPortionsToSort = (qryVerseIndex, startIndex, endIndex) => {
    let prevVerseID = qryVerseIndex.rows.item(startIndex).VerseID - 1;
    let startVerseID = qryVerseIndex.rows.item(startIndex).VerseID;
    let nextStartIndex = startIndex;
    let portionsToSort = [];
    let lastPortionIsSeparate = false;

    for (let index = startIndex; index <= endIndex; index++) {
      let currentVerseID = qryVerseIndex.rows.item(index).VerseID;
      let tempEndIndex;
      let shouldPush = false;

      if (index === endIndex) {
        tempEndIndex = index;
        shouldPush = true;
      }

      if (currentVerseID !== prevVerseID + 1 && !lastPortionIsSeparate) {
        tempEndIndex = index - 1;
        shouldPush = true;
      }

      if (shouldPush) {
        let {startPosition, endPosition} = checkStartAndEndPositions(
          qryVerseIndex,
          nextStartIndex,
          tempEndIndex,
        );

        let portionToSort = {
          startIndex: nextStartIndex,
          startPosition: startPosition,
          endIndex: tempEndIndex,
          endPosition: endPosition,
          startVerseID: startVerseID,
          endVerseID: prevVerseID,
        };
        portionsToSort.push(portionToSort);

        startVerseID = currentVerseID;
        nextStartIndex = tempEndIndex + 1;
      }

      prevVerseID = qryVerseIndex.rows.item(index).VerseID;

      if (index === endIndex && tempEndIndex !== index) {
        index--;
        lastPortionIsSeparate = true;
      }
    }
    return portionsToSort;
  };

  if (dayStartIndex < dayEndIndex) {
    portionsToSort = addPortionsToSort(
      qryVerseIndex,
      dayStartIndex,
      dayEndIndex,
    );

    portionsToSort.sort(function(a, b) {
      return a.endVerseID - b.startVerseID;
    });
  } else {
    let portionsToSort1 = addPortionsToSort(
      qryVerseIndex,
      dayStartIndex,
      maxIndex,
    );

    let portionsToSort2 = addPortionsToSort(
      qryVerseIndex,
      leastIndex,
      dayEndIndex,
    );

    portionsToSort1.sort(function(a, b) {
      return a.endVerseID - b.startVerseID;
    });
    portionsToSort2.sort(function(a, b) {
      return a.endVerseID - b.startVerseID;
    });

    portionsToSort = [...portionsToSort1, ...portionsToSort2];
  }
  //Check if the loop made only one array, if so our job is easy and we just return that array
  if (portionsToSort.length === 1) {
    let portion = createReadingPortion(
      qryVerseIndex,
      portionsToSort[0].startIndex,
      portionsToSort[0].startPosition,
      portionsToSort[0].endIndex,
      portionsToSort[0].endPosition,
      date,
    );
    portions.push(portion);
  } else {
    const sortPortionsByChronoOrder = portions => {
      let prevBibleBook = qryVerseIndex.rows.item(portions[0].startIndex)
        .BibleBook;
      let portionArrays = [[]];
      let innerIndex = 0;

      //Setup portions array to contain arrays of portions with the same bible book
      portions.forEach(portion => {
        if (
          prevBibleBook ===
          qryVerseIndex.rows.item(portion.startIndex).BibleBook
        ) {
          portionArrays[innerIndex].push(portion);
        } else {
          innerIndex++;
          portionArrays[innerIndex] = [];
          portionArrays[innerIndex].push(portion);
        }

        prevBibleBook = qryVerseIndex.rows.item(portion.endIndex).BibleBook;
      });

      //Now that the portions array is initialized and we have compartmentalized portions by their
      //bible books, we can sort the individual arrays by each portion's Chronological order again
      portionArrays.forEach(portionArray => {
        portionArray.sort(
          (a, b) =>
            qryVerseIndex.rows.item(a.startIndex).ChronologicalOrder -
            qryVerseIndex.rows.item(b.startIndex).ChronologicalOrder,
        );
      });

      //Then we sort all of the portions by the chronological order of their least item
      portionArrays.sort(
        (a, b) =>
          qryVerseIndex.rows.item(a[0].startIndex).ChronologicalOrder -
          qryVerseIndex.rows.item(b[0].startIndex).ChronologicalOrder,
      );
      //Finally, we extract all of the items into a single dimensional array as we recieved it
      let result = [];
      portionArrays.forEach(array => {
        result = [...result, ...array];
      });

      return result;
    };

    if (scheduleType === SCHEDULE_TYPES.CHRONOLOGICAL) {
      portionsToSort = [...sortPortionsByChronoOrder(portionsToSort)];
    }

    //Condense the portions if the last VerseID of one equals the first VerseID of another
    let arrayToCompare;
    let tempPortions = [];

    portionsToSort.map(sortedPortion => {
      if (arrayToCompare) {
        if (arrayToCompare.endVerseID === sortedPortion.startVerseID - 1) {
          arrayToCompare.endVerseID = sortedPortion.endVerseID;
          arrayToCompare.endIndex = sortedPortion.endIndex;
          arrayToCompare.endPosition = sortedPortion.endPosition;
        } else {
          tempPortions.push({...arrayToCompare});
          arrayToCompare = {...sortedPortion};
        }
      } else {
        arrayToCompare = {...sortedPortion};
      }
    });

    tempPortions.push(arrayToCompare);

    //Use condensed array of portions to create final reading portions for input
    tempPortions.map(condensedPortion => {
      let portion = createReadingPortion(
        qryVerseIndex,
        condensedPortion.startIndex,
        condensedPortion.startPosition,
        condensedPortion.endIndex,
        condensedPortion.endPosition,
        date,
      );
      portions.push(portion);
    });
  }

  return portions;
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
  ).then(res => {
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
    ).then(result => {
      if (wasSuccessful) {
        wasSuccessful = result;
      }
    });
  }

  return wasSuccessful;
}

//----------------------------- Schedule creation generator algorithms -----------------------------

/**
 * Creates a bible reading schedule
 * @param {Database} userDB
 * @param {Database} bibleDB
 * @param {ScheduleType} scheduleType
 * @param {number} dur - Duration of the schedule, in years
 * @param {integer} bookId - Number of the bible book to start from (1-66)
 * @param {integer} chapter
 * @param {integer} verse
 * @param {string} tableName
 * @param {Function} successCB
 * @param {Function} messageCB
 */
export async function generateBibleSchedule(
  userDB,
  bibleDB,
  scheduleType,
  dur,
  bookId,
  chapter,
  verse,
  tableName,
  successCB,
  messageCB,
) {
  //Get all required table and query references to be used in populating the table
  log('qryVerseIndex:', qryVerseIndex, 'qryMaxVerses:', qryMaxVerses);

  const qryVerseIndex = setQryVerseIndex(scheduleType);
  const bibleBookPrefix = 'bibleBooks.';
  const bibleBookSuffix = '.name';

  const {
    keys,
    duration,
    leastIndex,
    maxIndex,
    versesPerDay,
    buffer,
  } = setScheduleParameters(dur, qryVerseIndex, scheduleType);

  log('Starting schedule generation');

  //Find an index closest to the one requested
  let requestedIndex = await findVerseIndex(
    bibleDB,
    bookId,
    chapter,
    verse,
    scheduleType,
    true,
  );

  var pointer, keyIndex, endIndex, hasLooped, isEnd, verseOverflow;
  //Set variables which will keep track of certain values used for schedule creation
  await setTrackers(
    bibleDB,
    qryVerseIndex,
    requestedIndex,
    keys,
    leastIndex,
    maxIndex,
  ).then(res => {
    pointer = res.pointer;
    keyIndex = res.keyIndex;
    endIndex = res.endIndex;
    hasLooped = res.hasLooped;
    isEnd = res.isEnd;
    verseOverflow = res.verseOverflow;
  });

  //Check to see if we adjusted the requested verse because it was out of bounds
  let adjustedVerseMessage = setAdjustedMessage(
    bibleBookPrefix,
    bibleBookSuffix,
    bookId,
    chapter,
    verse,
    qryVerseIndex,
    pointer[keys[keyIndex]],
  );

  let readingPortions = [];
  let date = new Date();
  let versesToday = 0;
  let endCounter = 0;

  for (let i = 0; i < duration * 2; i++) {
    for (let k = 0; k < keys.length; k++) {
      if (i === 0) {
        k = keyIndex;
      }
      const key = keys[k];

      if (isEnd[key]) {
        console.log('Skipped day', key);
        continue;
      }

      log('day', i);

      let dayStartIndex = pointer[key];

      versesToday = versesPerDay[key] + verseOverflow[key];
      let dayEndIndex = pointer[key] + Math.round(versesToday);

      verseOverflow[key] = versesToday - Math.floor(versesToday);

      log(
        'Before checkEnd: dayEndIndex =',
        dayEndIndex,
        'maxIndex =',
        maxIndex[key],
        'leastIndex =',
        leastIndex[key],
        'endIndex =',
        endIndex[key],
        'verseOverflow =',
        verseOverflow[key],
        'hasLooped =',
        hasLooped[key],
        'buffer =',
        buffer[key],
        'isEnd =',
        isEnd[key],
      );

      let endCheck = checkEnd(
        qryVerseIndex,
        dayEndIndex,
        maxIndex[key],
        leastIndex[key],
        endIndex[key],
        verseOverflow[key],
        hasLooped[key],
        buffer[key],
        isEnd[key],
        scheduleType,
      );

      dayEndIndex = endCheck.dayEndIndex;
      isEnd[key] = endCheck.isEnd;
      hasLooped[key] = endCheck.hasLooped;
      verseOverflow[key] += endCheck.verseOverflow;

      log(
        'after check end: dayEndIndex =',
        dayEndIndex,
        'maxIndex =',
        maxIndex[key],
        'leastIndex =',
        leastIndex[key],
        'endIndex =',
        endIndex[key],
        'verseOverflow =',
        verseOverflow[key],
        'hasLooped =',
        hasLooped[key],
        'buffer =',
        buffer[key],
        'isEnd =',
        isEnd[key],
      );

      let portions = createReadingPortions(
        qryVerseIndex,
        dayStartIndex,
        dayEndIndex,
        date,
        scheduleType,
        leastIndex[key],
        maxIndex[key],
      );

      log('Created reading portions:', portions);

      for (let j = 0; j < portions.length; j++) {
        const el = portions[j];
        readingPortions.push(el);
      }

      pointer[key] = dayEndIndex + 1;
      date.setDate(date.getDate() + 1);

      log(
        'day',
        key,
        'isEnd',
        isEnd[key],
        'hasLooped',
        hasLooped[key],
        'leastIndex',
        leastIndex[key],
        'pointer',
        pointer[key],
        'maxIndex',
        maxIndex[key],
        'versesPerDay',
        versesPerDay[key],
        'verseOverflow',
        verseOverflow[key],
      );
      log(
        '___________________________________________________________________',
      );

      if (pointer[key] > maxIndex[key]) {
        pointer[key] = leastIndex[key];
      }

      if (isEnd[key]) {
        console.log('day', key, 'ended at', i, 'days');
        endCounter++;
      }

      //Adjust the i index to represent a new schedule day if we have several types of days
      if (keys.length > 1 && k !== keys.length - 1) {
        i++;
      }
    }
    if (endCounter >= keys.length) {
      console.log('Schedule created lasts', i, 'days');
      break;
    }
  }

  await insertReadingPortions(
    userDB,
    readingPortions,
    tableName,
    bibleScheduleValuesArray,
  )
    .then(wasSucessful => {
      if (wasSucessful) {
        console.log('Every insert was successful');
        if (adjustedVerseMessage) {
          messageCB(adjustedVerseMessage);
        }
        successCB();
      } else {
        console.log('Insert failed');
      }
      timeKeeper('Ended at.....');
    })
    .catch(err => {
      errorCB(err);
      timeKeeper('Ended at.....');
    });
}

/**
 * Creates a schedule for reading a publication such as a book or magazine breaking it up by user specified "portions" (Article, Page, Chapter, etc.)
 * @param {Database} userDB
 * @param {string} tableName
 * @param {number} startingPortion - (Must be between 0 and 1,000,000,000,000,000) The portion to begin the schedule from
 * @param {number} maxPortion - The number of the last portion in the publication
 * @param {string} readingPortionDesc - A user provided description of the sections to break up their reading by
 * @param {number} portionsPerDay - How many portions to read each day
 * @param {Function} successCB
 */
export function generateCustomSchedule(
  userDB,
  tableName,
  startingPortion,
  maxPortion,
  readingPortionDesc,
  portionsPerDay,
  successCB,
) {
  log('started creating schedule');

  portionsPerDay = parseFloat(portionsPerDay, 10);
  maxPortion = parseFloat(maxPortion, 10);

  let date = new Date();
  let pointer = parseFloat(startingPortion, 10);
  let readingPortion = '';
  let readingPortions = [];
  let adjustment = portionsPerDay < 1 ? 0 : 1;

  log(
    'pointer',
    pointer,
    'readingPortion',
    readingPortion,
    'readingPortions',
    readingPortions,
    'adjustment',
    adjustment,
    'portionsPerDay',
    portionsPerDay,
    'maxPortion',
    maxPortion,
  );

  while (pointer <= maxPortion) {
    log('pointer', pointer, 'readingPortion', readingPortion);

    readingPortion = readingPortionDesc + ' ' + pointer;

    if (portionsPerDay !== 1) {
      if (pointer !== maxPortion) {
        pointer += portionsPerDay - adjustment;
        pointer = Math.round(pointer * 10) / 10;
        if (pointer > maxPortion) {
          pointer = maxPortion;
        }
        readingPortion += '-' + pointer;
      } else {
        adjustment = 1;
      }
    }

    pointer += adjustment;

    let temp = createCustomReadingPortionArray(date, readingPortion);
    readingPortions.push(temp);
    //Move date ahead
    date.setDate(date.getDate() + 1);
  }

  if (readingPortions.length < 1) {
    return;
  }

  insertReadingPortions(
    userDB,
    readingPortions,
    tableName,
    customScheduleValuesArray,
  ).then(wasSucessful => {
    if (wasSucessful) {
      console.log('Every insert was successful');
      successCB();
    } else {
      console.log('Insert failed');
    }
  });
}
