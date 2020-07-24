import {
  log,
  timeKeeper,
  searchQuery,
  createPlaceholdersFromArray,
  errorCB,
  formatDate,
  getQuery,
} from './generalTransactions';
import {translate} from '../../localization/localization';
import {getScheduleTypes} from '../../components/popups/ScheduleTypeSelectionPopup';

const prefix = 'scheduleTransactions.';
const scheduleTypes = getScheduleTypes();

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

export function updateDailyText(userDB, date, afterUpdate) {
  userDB
    .transaction(txn => {
      let sql = `UPDATE tblDates
                  SET Date = ?
                  WHERE Name="DailyText";`;
      txn.executeSql(sql, [date]).then(afterUpdate());
    })
    .catch(errorCB);
}

export function formatScheduleTableName(id) {
  const tableName = 'tblSchedule' + id;

  return tableName;
}

export function getHideCompleted(db, scheduleName, cb) {
  db.transaction(txn => {
    txn
      .executeSql(
        `SELECT HideCompleted FROM tblSchedules WHERE ScheduleName = "${scheduleName}"`,
        [],
      )
      .then(([t, res]) => {
        if (res.rows.length > 0) {
          let item = res.rows.item(0).HideCompleted;
          let value;

          if (item === 0) {
            value = false;
          } else if (item === 1) {
            value = true;
          }

          cb(value);
        }
      });
  }).catch(errorCB);
}

export function setHideCompleted(db, scheduleName, value, successCallBack) {
  let hideCompleted = value ? 1 : 0;

  successCallBack(value);

  db.transaction(txn => {
    txn.executeSql(
      `UPDATE tblSchedules SET HideCompleted = ${hideCompleted} WHERE ScheduleName = "${scheduleName}";`,
      [],
    );
  }).catch(errorCB);
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
    let sql = `SELECT VerseID, BookName, Verse, Chapter, BibleBook
      FROM tblVerseIndex
      INNER JOIN tblBibleBooks on tblBibleBooks.BibleBookID = tblVerseIndex.BibleBook;`;

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

export async function addSchedule(
  userDB,
  bibleDB,
  scheduleType,
  scheduleName,
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

  await userDB
    .transaction(txn => {
      //Check if a schedule with that name already exists
      txn
        .executeSql(
          `SELECT 1 FROM tblSchedules WHERE ScheduleName = "${scheduleName}"`,
          [],
        )
        .then(([txn, res]) => {
          scheduleNameExists = res.rows.length > 0;
        });
    })
    .catch(errorCB);

  if (!scheduleNameExists) {
    log('Creating schehdule table');

    //If it doesn't already exist, add a value to the schedules table with correlating info
    await userDB
      .transaction(txn => {
        txn
          .executeSql(
            'INSERT INTO tblSchedules (ScheduleName, HideCompleted, ScheduleType) VALUES (?, 0, ?)',
            [scheduleName, scheduleType],
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

    let SQL;

    if (scheduleType !== scheduleTypes.custom) {
      SQL = `CREATE TABLE IF NOT EXISTS ${tableName}
              (ReadingDayID INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE, 
              StartBookName VARCHAR(20), 
              StartBookNumber INTEGER, 
              StartChapter INTEGER, 
              StartVerse INTEGER,
              EndBookName VARCHAR(20), 
              EndBookNumber INTEGER, 
              EndChapter INTEGER, 
              EndVerse INTEGER,
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

    //Populate the table with reading information
    if (scheduleType !== scheduleTypes.custom) {
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
    errorCallBack(translate(prefix + 'scheduleNameTakenPrompt'));
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
      case scheduleTypes.sequential:
        queryOrView = 'tblVerseIndex';
        indexKey = 'VerseID';
        break;
      case scheduleTypes.chronological:
        queryOrView = 'qryChronologicalOrder';
        indexKey = 'RowNum';
        break;
      case scheduleTypes.thematic:
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
    case scheduleTypes.sequential:
      tempQuery = tblVerseIndex;
      break;
    case scheduleTypes.chronological:
      tempQuery = qryChronologicalIndex;
      break;
    case scheduleTypes.thematic:
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

  if (scheduleType !== scheduleTypes.thematic) {
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
        pointer[key] = indexStart + approxPosition;
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
  let endChapter = endPortion.Chapter;
  let endVerse = endPortion.Verse;

  if (endVerse < buffer) {
    return 0 - endVerse;
  }

  let index = searchQuery(
    qryMaxVerses,
    'BibleBook',
    endPortion.BibleBook,
    'Chapter',
    endChapter,
  );
  const element = qryMaxVerses.rows.item(index);

  let difference = element.MaxVerse - endVerse;
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

  let checker = endValue => {
    let isSame;
    let tracker;
    let adj = 0;

    if (endValue > 0) {
      tracker = 1;
    } else {
      tracker = -1;
    }

    let comparison = (i, endValue) => {
      if (endValue < 0) {
        return i > endValue;
      } else {
        return i < endValue;
      }
    };

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
    return adj;
  };

  //Check the upper bound
  let maxAdj = checker(buffer + 1);
  //Check the lower bound
  let minAdj = checker(0 - buffer) - 1;

  let adjustment = maxAdj < Math.abs(minAdj) ? maxAdj : minAdj;

  return adjustment;
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
      case scheduleTypes.sequential:
        checkVerseBuffer = checkOrderedVerseBuffer;
        break;
      case scheduleTypes.chronological:
        checkVerseBuffer = checkAnyVerseBuffer;
        break;
      case scheduleTypes.thematic:
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

function createReadingPortion(qryVerseIndex, dayStartIndex, dayEndIndex, date) {
  let startBookNumber;
  let startBookName;
  let startChapter;
  let startVerse;
  let endBookNumber;
  let endBookName;
  let endChapter;
  let endVerse;
  let portions = [];
  let tempString = '';
  const bibleBookPrefix = 'bibleBooks.';
  const bibleBookSuffix = '.name';

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

  tempString = `${startBookName} ${startChapter}:${startVerse} - ${endBookName} ${endChapter}:${endVerse}`;

  log(tempString);

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
    tempString,
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

  let addPortionsToSort = (qryVerseIndex, startIndex, endIndex) => {
    let prevVerseID = qryVerseIndex.rows.item(startIndex).VerseID - 1;
    let startVerseID = qryVerseIndex.rows.item(startIndex).VerseID;
    let nextStartIndex = startIndex;
    let portionsToSort = [];

    for (let index = startIndex; index <= endIndex; index++) {
      let currentVerseID = qryVerseIndex.rows.item(index).VerseID;

      if (currentVerseID !== prevVerseID + 1 || index === endIndex) {
        let tempIndex = index === endIndex ? index : index - 1;
        let portionToSort = {
          startIndex: nextStartIndex,
          endIndex: tempIndex,
          startVerseID: startVerseID,
          endVerseID: prevVerseID,
        };
        portionsToSort.push(portionToSort);

        startVerseID = currentVerseID;
        nextStartIndex = tempIndex + 1;
      }

      prevVerseID = qryVerseIndex.rows.item(index).VerseID;
    }
    return portionsToSort;
  };

  //If this is not a chronological schedule we can rest assured that everything is in order of VerseID
  //and automatically return the reading portion array
  if (scheduleType === scheduleTypes.sequential) {
    let temp = createReadingPortion(
      qryVerseIndex,
      dayStartIndex,
      dayEndIndex,
      date,
    );
    portions.push(temp);
    return portions;
  }

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
      portionsToSort[0].endIndex,
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
        condensedPortion.endIndex,
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
          console.log('Insert success');
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
