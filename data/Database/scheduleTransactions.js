import {
  log,
  timeKeeper,
  searchQuery,
  createPlaceholdersFromArray,
  errorCB,
  formatDate,
  getQuery,
} from './generalTransactions';
import {translate} from '../../logic/localization/localization';
import {SCHEDULE_TYPES} from '../../components/popups/ScheduleTypeSelectionPopup';
import {getWeeksBetween, getWeekdaysAfterToday} from '../../logic/logic';

const prefix = 'scheduleTransactions.';
export const VERSE_POSITION = {START: 0, MIDDLE: 1, END: 2, START_AND_END: 3};
export const WEEKLY_READING_TABLE_NAME = 'tblWeeklyReading';

var qryMaxChapters;
var qryMaxVerses;
var tblVerseIndex;
var qryChronologicalOrder;
var qryChronologicalIndex;
var qryThematicOrder;
var qryThematicIndex;
var qryThematicCount;
let qryThematicLeastIndices;

//Updating schedule info

export async function deleteSchedule(db, tableName, scheduleName) {
  db.transaction(txn => {
    txn.executeSql(
      `DELETE FROM tblSchedules WHERE ScheduleName='${scheduleName}'`,
      [],
    );

    txn.executeSql(`DROP TABLE IF EXISTS  ${tableName}`, []).then(() => {
      console.log('Deleted table ', tableName);
    });
  }).catch(errorCB);
}

export function clearSchedules(txn) {
  txn.executeSql('SELECT * FROM tblSchedules', []).then(([t, res]) => {
    for (let i = 0; i < res.rows.length; ++i) {
      let schedule = res.rows.item(i).ScheduleName;
      txn.executeSql(`DROP TABLE IF EXISTS  ${schedule}`, [], () => {
        console.log('Deleted table ', schedule);
      });
    }
  });

  txn.executeSql('DELETE FROM tblSchedules', []);
}

export function updateReadStatus(db, tableName, id, status, afterUpdate) {
  let bool = status ? 1 : 0;
  db.transaction(txn => {
    let sql = `UPDATE ${tableName}
    SET IsFinished=${bool}
    WHERE ReadingDayID=${id};`;
    txn.executeSql(sql, []).then(afterUpdate());
  }).catch(errorCB);
}

export async function updateDates(userDB, date, name, afterUpdate = () => {}) {
  await userDB
    .transaction(txn => {
      let sql = `UPDATE tblDates
                  SET Date=?
                  WHERE Name=?;`;
      txn.executeSql(sql, [date.toString(), name]).then(afterUpdate());
    })
    .catch(errorCB);
}

export function formatScheduleTableName(id) {
  const tableName = 'tblSchedule' + id;

  return tableName;
}

export async function getScheduleSettings(db, scheduleName) {
  let hideCompleted;
  let doesTrack;

  await db
    .transaction(txn => {
      txn
        .executeSql('SELECT * FROM tblSchedules WHERE ScheduleName=?', [
          scheduleName,
        ])
        .then(([t, res]) => {
          if (res.rows.length > 0) {
            hideCompleted = res.rows.item(0).HideCompleted ? true : false;
            doesTrack = res.rows.item(0).DoesTrack ? true : false;
          }
        });
    })
    .catch(errorCB);

  return {doesTrack, hideCompleted};
}

export async function setHideCompleted(db, scheduleName, value) {
  let hideCompleted = value ? 1 : 0;

  await db
    .transaction(txn => {
      txn.executeSql(
        'UPDATE tblSchedules SET HideCompleted=? WHERE ScheduleName=?;',
        [hideCompleted, scheduleName],
      );
    })
    .catch(errorCB);
}

//Seting up needed info
function createQryOrderIndex(query) {
  const item = i => {
    const index = query.rows.item(i).VerseID - 1;
    const result = tblVerseIndex.rows.item(index);

    return result;
  };
  const length = tblVerseIndex.rows.length;
  return {rows: {length: length, item: item}};
}

export async function runQueries(bibleDB) {
  if (!tblVerseIndex) {
    let sql = 'SELECT * FROM tblVerseIndex';

    await getQuery(bibleDB, sql).then(res => {
      tblVerseIndex = res;
    });
  }

  if (!qryMaxVerses) {
    await getQuery(bibleDB, 'SELECT * FROM qryMaxVerses').then(res => {
      qryMaxVerses = res;
    });
  }

  if (!qryChronologicalOrder) {
    await getQuery(bibleDB, 'SELECT * FROM qryChronologicalOrder').then(res => {
      qryChronologicalOrder = res;
      qryChronologicalIndex = createQryOrderIndex(res);
    });
  }

  if (!qryThematicOrder) {
    await getQuery(bibleDB, 'SELECT * FROM qryThematicOrder').then(res => {
      qryThematicOrder = res;
      qryThematicIndex = createQryOrderIndex(res);
    });
  }

  if (!qryThematicCount) {
    await getQuery(bibleDB, 'SELECT * FROM qryThematicCount').then(res => {
      qryThematicCount = res;
    });
  }

  if (!qryThematicLeastIndices) {
    await getQuery(bibleDB, 'SELECT * FROM qryThematicLeastIndices').then(
      res => {
        qryThematicLeastIndices = res;
      },
    );
  }
}

//Creating schedules
async function createScheduleTable(userDB, tableName, scheduleType) {
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
            IsFinished BOOLEAN DEFAULT 0)`;
  }

  await userDB
    .transaction(txn => {
      //Create a table for this new schedule based on the formated name
      txn.executeSql(SQL, []).then(() => {
        log('Table', tableName, 'created successfully');
      });
    })
    .catch(errorCB);

  return;
}

export async function addSchedule(
  userDB,
  bibleDB,
  scheduleType,
  scheduleName,
  doesTrack,
  activeDays,
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

  await userDB
    .transaction(txn => {
      //Check if a schedule with that name already exists
      txn
        .executeSql(
          `SELECT 1 FROM tblSchedules WHERE ScheduleName="${scheduleName}"`,
          [],
        )
        .then(([txn, res]) => {
          scheduleNameExists = res.rows.length > 0;
        });
    })
    .catch(errorCB);

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
    await userDB
      .transaction(txn => {
        txn
          .executeSql(
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
                  ?, ?, ?, ?, ?, ?, ?)`,
            [
              scheduleName,
              doesTrack,
              scheduleType,
              JSON.stringify(creationInfo),
              ...activeDays,
            ],
          )
          .then(() => {
            log(scheduleName, 'inserted successfully');
          });

        //Get the newly created schedule info to extract it's ID to use for unique table name creation
        txn
          .executeSql(
            'SELECT ScheduleID FROM tblSchedules WHERE ScheduleName = ?',
            [scheduleName],
          )
          .then(([txn, res]) => {
            let id = res.rows.item(0).ScheduleID;
            tableName = formatScheduleTableName(id);

            log(
              'Creating table for schedule',
              scheduleName,
              'named',
              tableName,
            );
          });
      })
      .catch(errorCB);

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

export async function createWeeklyReadingSchedule(
  userDB,
  bibleDB,
  resetDayOfWeek,
) {
  let date = new Date();
  /*
  This returns 0 - 6 based on the day the user wishes to reset, for instance, if it resets
  on Thursday, then Wednesday will be index 6 of the week and Thursday will be index 0 of
  the week (Thanks Number Theory!)
  */
  let adjustedWeekIndex = getWeekdaysAfterToday(resetDayOfWeek);
  console.log('adjustedWeekIndex "After"', adjustedWeekIndex);
  let adjustedDate = date.getDate() - adjustedWeekIndex;
  date.setDate(adjustedDate);
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  let weeklyReadingCurrent;
  let weeklyReadingStart;
  let weeklyReadingInfo;
  let tableName = WEEKLY_READING_TABLE_NAME;

  timeKeeper('Started at creating weekly reading schedule at.....');

  await userDB
    .transaction(txn => {
      txn
        .executeSql(
          'SELECT * FROM tblDates WHERE Name="WeeklyReadingStart" OR Name="WeeklyReadingCurrent"',
        )
        .then(([t, res]) => {
          for (let i = 0; i < res.rows.length; i++) {
            const name = res.rows.item(i).Name;
            switch (name) {
              case 'WeeklyReadingStart':
                weeklyReadingStart = res.rows.item(i);
                break;
              case 'WeeklyReadingCurrent':
                weeklyReadingCurrent = res.rows.item(i).Date;
                break;
            }
          }
        });
    })
    .catch(err => {
      errorCB(err);
    });

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

  if (lastWeekRead < currentWeek) {
    await updateDates(userDB, date, 'WeeklyReadingCurrent', () => {});

    //drop table from previous week
    await userDB
      .transaction(txn => {
        txn.executeSql(`DROP TABLE IF EXISTS ${tableName};`, []);
      })
      .catch(err => {
        errorCB(err);
      });

    let scheduleName = translate('reminders.weeklyReading.title');

    await userDB
      .transaction(txn => {
        txn
          .executeSql(
            'INSERT INTO tblSchedules (ScheduleName, HideCompleted, ScheduleType) VALUES (?, 0, ?)',
            [scheduleName, SCHEDULE_TYPES.SEQUENTIAL],
          )
          .then(() => {
            log(scheduleName, 'inserted successfully');
          });
      })
      .catch(errorCB);

    await createScheduleTable(userDB, tableName);

    //Generate schedule for current week
    await bibleDB
      .transaction(txn => {
        txn
          .executeSql('SELECT * FROM tblVerseIndex WHERE WeeklyOrder=?', [
            currentWeek,
          ])
          .then(([t, res]) => {
            weeklyReadingInfo = res;
          });
      })
      .catch(err => {
        errorCB(err);
      });

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

//Searching for indexes based on values
export async function findMaxChapter(bibleDB, bookId) {
  if (!qryMaxChapters) {
    //Obtain max chapters info
    await bibleDB
      .transaction(txn => {
        txn
          .executeSql('SELECT BibleBook, MaxChapter FROM qryMaxChapters', [])
          .then(([txn, res]) => {
            qryMaxChapters = res;
          });
      })
      .catch(errorCB);
  }
  let index = searchQuery(qryMaxChapters, 'BibleBook', bookId);

  return qryMaxChapters.rows.item(index).MaxChapter;
}

function findMaxVerse(bookId, chapter) {
  let index = searchQuery(
    qryMaxVerses,
    'BibleBook',
    bookId,
    'Chapter',
    chapter,
  );

  return qryMaxVerses.rows.item(index).MaxVerse;
}

function findNearestVerse(bookId, chapter, verse) {
  let index = 0;

  log('bookId:', bookId, 'chapter:', chapter, 'verse:', verse);

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

async function findVerseIndex(
  bibleDB,
  bookId,
  chapter,
  verse,
  scheduleType,
  isFirstTime,
) {
  let index = 0;
  let found;

  await bibleDB
    .transaction(txn => {
      const sql = `SELECT VerseID 
        FROM tblVerseIndex 
        WHERE BibleBook = ${bookId} AND Chapter = ${chapter} AND Verse = ${verse};`;

      //Find index in table for specific verse
      txn.executeSql(sql, []).then(([txn, res]) => {
        if (res.rows.length > 0) {
          //The verse searched for exists
          found = true;
          index = res.rows.item(0).VerseID;
        }
      });
    })
    .catch(errorCB);

  log('isFirstTime', isFirstTime);

  //If there is no such verse, then we have to adjust
  //(Make sure the recurssive call only runs once too)
  if (!found && isFirstTime) {
    //First check if the chapter is out of bounds and adjust. This makes later processses easier
    let maxChapter = await findMaxChapter(bibleDB, bookId);

    if (chapter > maxChapter) {
      chapter = 1;
      bookId++;
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
    await bibleDB.transaction(txn => {
      txn
        .executeSql(`SELECT * FROM ${queryOrView} WHERE VerseID=?`, [index])
        .then(([t, res]) => {
          index = res.rows.item(0)[indexKey] - 1;
        })
        .catch(errorCB);
    });
  }

  return index;
}

//Setting up values for schedule creation

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

function setScheduleParameters(dur, qryVerseIndex, scheduleType) {
  dur = parseFloat(dur, 10);

  //Transform the duration into an amount of days based on the years given by user
  const duration = dur * 365 + dur * 7;
  /*
    Apparently, (I assume because of truncating of decimal places) the schedules get farther
    and farther off target the more years they run, thus the "+ duration * 7" adjustment.
    It matches the target numbers well even all the way up to a 7 year schedule.
  */

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

async function setTrackers(
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
    await bibleDB.transaction(txn => {
      txn
        .executeSql('SELECT * FROM qryThematicOrder WHERE VerseID=?', [
          requestedIndex + 1,
        ])
        .then(([t, res]) => {
          startKey = res.rows.item(0).ThematicOrder - 1;
        })
        .catch(errorCB);
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
    pointer: pointer,
    keyIndex: keyIndex,
    endIndex: endIndex,
    hasLooped: hasLooped,
    isEnd: isEnd,
    verseOverflow: verseOverflow,
  };
}

function setAdjustedMessage(
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

//For use in creating schedules

function checkOrderedVerseBuffer(qryVerseIndex, checkIndex, buffer) {
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

function checkAnyVerseBuffer(
  qryVerseIndex,
  checkIndex,
  buffer,
  maxIndex,
  leatIndex,
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
    } else {
      tracker = -1;
    }

    for (let i = tracker; comparison(i, endValue); i += tracker) {
      let currentIndex = checkIndex + i;
      if (currentIndex > maxIndex) {
        i = maxIndex - checkIndex;
        endValue = i - 1;
      }
      if (currentIndex < leatIndex) {
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
  let minAdj = checker(0 - buffer) - 1;

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

function checkStartAndEndPositions(qryVerseIndex, startIndex, endIndex) {
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

function checkResultPosition(isStart, isEnd) {
  let start = VERSE_POSITION.START;
  let middle = VERSE_POSITION.MIDDLE;
  let end = VERSE_POSITION.END;

  if (isStart || isEnd) {
    if (isStart) {
      return start;
    } else {
      return end;
    }
  } else {
    return middle;
  }
}

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
  let startAndEnd = VERSE_POSITION.START_AND_END;
  let resultString;
  let resultPosition;

  if (startBook === endBook) {
    if (startChapter === endChapter) {
      if (startVerse === endVerse) {
        // Here we have the same book, chapter, and verse
        resultPosition = checkResultPosition(isStart, isEnd);
        resultString = `${startBook} ${startChapter}:${startVerse}`;
      } else if (isStart && isEnd) {
        // Here we have the same book, chapter, and different verses
        resultPosition = startAndEnd;
        resultString = `${startBook} ${startChapter}`;
      } else {
        // Here we have the same book, chapter, and different verses
        resultPosition = checkResultPosition(isStart, isEnd);
        resultString = `${startBook} ${startChapter}:${startVerse}-${endVerse}`;
      }
    } else if (isStart && isEnd) {
      // Here we have the same book and different chapters
      resultPosition = startAndEnd;
      resultString = `${startBook} ${startChapter}-${endChapter}`;
    } else {
      // Here we have the same book and different chapters
      resultPosition = checkResultPosition(isStart, isEnd);
      resultString = `${startBook} ${startChapter}:${startVerse}-${endChapter}:${endVerse}`;
    }
  } else if (isStart && isEnd) {
    // Here we have the different books
    resultPosition = startAndEnd;
    resultString = `${startBook} ${startChapter}-${endBook} ${endChapter}`;
  } else {
    // Here we have the different books
    resultPosition = checkResultPosition(isStart, isEnd);
    resultString = `${startBook} ${startChapter}:${startVerse}-${endBook} ${endChapter}:${endVerse}`;
  }
  return {description: resultString, position: resultPosition};
}

function checkEnd(
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
    dayEndIndex: dayEndIndex,
    isEnd: isEnd,
    hasLooped: hasLooped,
    verseOverflow: verseOverflow,
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

function createReadingPortion(
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

function createReadingPortions(
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

  let addPortionsToSort = (qryVerseIndex, startIndex, endIndex) => {
    let prevVerseID = qryVerseIndex.rows.item(startIndex).VerseID - 1;
    let startVerseID = qryVerseIndex.rows.item(startIndex).VerseID;
    let nextStartIndex = startIndex;
    let portionsToSort = [];

    for (let index = startIndex; index <= endIndex; index++) {
      let currentVerseID = qryVerseIndex.rows.item(index).VerseID;

      if (currentVerseID !== prevVerseID + 1 || index === endIndex) {
        let tempEndIndex = index === endIndex ? index : index - 1;

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
    }
    return portionsToSort;
  };

  //Otherwise we need to run through the whole day's reading, find when the reading changes position
  //relative to the order in the bible, and then sort and condense the resulting arrays to clean up
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
    //And condense the portions if the last VerseID of one equals the first VerseID of another
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

async function insertReadingPortions(
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

  let sql = `INSERT INTO ${tableName} (${valuesArray}) VALUES ${placeholders}`;

  log('insert sql', sql, 'values', values);

  await userDB
    .transaction(txn => {
      txn.executeSql(sql, values).then(([tx, results]) => {
        if (results.rowsAffected > 0) {
          log('Insert success');
        } else {
          wasSuccessful = false;
          console.log('Insert failed');
        }
      });
    })
    .catch(errorCB);

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

//Schedule creation generator algorithms

async function generateBibleSchedule(
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

      log('versesPerDay', versesPerDay[key], 'buffer', buffer[key]);

      let dayStartIndex = pointer[key];

      versesToday = versesPerDay[key] + verseOverflow[key];
      let dayEndIndex = pointer[key] + Math.round(versesToday);

      verseOverflow[key] = versesToday - Math.floor(versesToday);

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

      log('Check end finished');

      dayEndIndex = endCheck.dayEndIndex;
      isEnd[key] = endCheck.isEnd;
      hasLooped[key] = endCheck.hasLooped;
      verseOverflow[key] += endCheck.verseOverflow;

      let portions = createReadingPortions(
        qryVerseIndex,
        dayStartIndex,
        dayEndIndex,
        date,
        scheduleType,
        leastIndex[key],
        maxIndex[key],
      );

      log('Created reading portions');

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

function generateCustomSchedule(
  userDB,
  tableName,
  startingPortion,
  maxPortion,
  readingPortionDesc,
  portionsPerDay,
  successCB,
) {
  log('started creating schedule');
  let date = new Date();
  let pointer = parseFloat(startingPortion, 10);
  let readingPortion = '';
  let readingPortions = [];
  let adjustment = portionsPerDay < 1 ? 0 : 1;

  portionsPerDay = parseFloat(portionsPerDay, 10);
  maxPortion = parseFloat(maxPortion, 10);

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
