import {log, searchQuery, runSQL} from '../data/Database/generalTransactions';
import {translate} from './localization/localization';
import {getWeeksBetween, SCHEDULE_TYPES, VERSE_POSITION} from './general';

const prefix = 'scheduleTransactions.';

/**
 * The result from a query to the database
 * @typedef {object} DBQueryResult
 * @property {object} DBQueryResult.rows - The rows returned containing data matching the query
 * @property {number} DBQueryResult.rows.length - The number of rows in the result
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
  const item = (i) => {
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

//------------------------------ Searching for indexes based on values ------------------------------
/**
 * Given a Bible book returns the largest chapter for it
 * @param {number} bookId
 * @returns {number}
 */
export async function findMaxChapter(bookId, bibleDB) {
  if (!qryMaxChapters) {
    qryMaxChapters = await runSQL(bibleDB, 'SELECT * FROM qryMaxChapters;');
  }
  let index = searchQuery(qryMaxChapters, 'BibleBook', bookId);

  return qryMaxChapters.rows.item(index).MaxChapter;
}

/**
 * Given a Bible book and chapter returns the largest verse for it
 * @param {number} bookId
 * @param {number} chapter
 * @returns {number}
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
 * @param {number} bookId
 * @param {number} chapter
 * @param {number} verse
 * @returns {Array<number>} [bookId, chapter, verse]
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
 * @param {number} bookId
 * @param {number} chapter
 * @param {number} verse
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
  ).then((res) => {
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
    ]).then((res) => {
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
 * @param {number} requestedIndex - The index which the user has selected, or which has been adjusted to the nearest existing value to it
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
    ]).then((res) => {
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
 * @param {number} bookId
 * @param {number} chapter
 * @param {number} verse
 * @param {number} pointer - The index which our create bible schedule algorithm decided on
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
 * @param {number} checkIndex - The current index in the query to check against
 * @param {number} buffer - An acceptable range of verses + or - the index to check against
 * @returns {number} the adjustment, which when added to the original index gives the new index
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
 * @param {number} checkIndex - The current index in the query to check against
 * @param {number} buffer - An acceptable range of verses + or - the index to check against
 * @param {number} maxIndex - The largest index for the current portion of the schedule
 * @param {number} leastIndex - The smallest index for the current portion of the schedule
 * @returns {number} the adjustment, which when added to the original index gives the new index
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

  let checker = (endValue) => {
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
 * @param {number} bookId
 * @param {number} chapter
 * @param {number} verse
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
 * @param {number} startIndex - First index for a verse span
 * @param {number} endIndex - Last index for a verse span
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

  return {startPosition, endPosition};
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
 * @returns {{description, position}}
 * @property {string} description - Details the span of verses to be read
 * @property {VersePosition} position - An identifier detaling the location of the entire reading relative to the chapter
 *
 * @param {number} startChapter
 * @param {number} startVerse
 * @param {boolean} isStart
 * @param {number} endChapter
 * @param {number} endVerse
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
 * @param {number} dayEndIndex
 * @param {number} maxIndex
 * @param {number} leastIndex
 * @param {number} endIndex
 * @param {number} verseOverflow
 * @param {boolean} hasLooped
 * @param {number} buffer
 * @param {boolean} isEnd
 * @param {ScheduleType} scheduleType
 *
 * @returns {object} result
 * @property {number} result.dayEndIndex - Adjusted index for the end of this reading day
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

/**
 * Takes values for a schedule reading day and returns an array of values for use in a database transaction
 * @param {string} startBookName
 * @param {number} startBookNumber
 * @param {number} startChapter
 * @param {number} startVerse
 * @param {string} endBookName
 * @param {number} endBookNumber
 * @param {number} endChapter
 * @param {number} endVerse
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
  date.setHours(0, 0, 0, 0);

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
  result.push(date.toISOString());

  //ReadingPortion
  result.push(description);

  //VersePosition
  result.push(versePosition);

  return result;
}

function createCustomReadingPortionArray(date, description) {
  let result = [];
  date.setHours(0, 0, 0, 0);

  //CompletionDate
  result.push(date.toISOString());

  //ReadingPortion
  result.push(description);

  return result;
}

/**
 * Given result values for a reading portion calls other helper functions to create a final array of values for insertion into schedule
 * @param {DBQueryResult} qryVerseIndex
 * @param {number} dayStartIndex
 * @param {VersePosition} dayStartPosition
 * @param {number} dayEndIndex
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
 * @param {number} dayStartIndex
 * @param {number} dayEndIndex
 * @param {Date} date
 * @param {ScheduleType} scheduleType
 * @param {number} leastIndex
 * @param {number} maxIndex
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

    portionsToSort.sort(function (a, b) {
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

    portionsToSort1.sort(function (a, b) {
      return a.endVerseID - b.startVerseID;
    });
    portionsToSort2.sort(function (a, b) {
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
    const sortPortionsByChronoOrder = (portions) => {
      let prevBibleBook = qryVerseIndex.rows.item(
        portions[0].startIndex,
      ).BibleBook;
      let portionArrays = [[]];
      let innerIndex = 0;

      //Setup portions array to contain arrays of portions with the same bible book
      portions.forEach((portion) => {
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
      portionArrays.forEach((portionArray) => {
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
      portionArrays.forEach((array) => {
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

    portionsToSort.map((sortedPortion) => {
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
    tempPortions.map((condensedPortion) => {
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

//----------------------------- Schedule creation generator algorithms -----------------------------
/**
 * Creates a bible reading schedule
 * @param {Database} bibleDB
 * @param {ScheduleType} scheduleType
 * @param {number} dur - Duration of the schedule, in years
 * @param {number} bookId - Number of the bible book to start from (1-66)
 * @param {number} chapter
 * @param {number} verse
 */
export async function generateBibleSchedule(
  bibleDB,
  scheduleType,
  dur,
  bookId,
  chapter,
  verse,
  startDate = new Date(),
) {
  if (
    !qryMaxVerses ||
    !tblVerseIndex ||
    !qryChronologicalOrder ||
    !qryThematicOrder ||
    !qryThematicCount
  ) {
    await runQueries(bibleDB);
  }

  //Get all required table and query references to be used in populating the table
  log('qryVerseIndex:', qryVerseIndex, 'qryMaxVerses:', qryMaxVerses);

  const qryVerseIndex = setQryVerseIndex(scheduleType);
  const bibleBookPrefix = 'bibleBooks.';
  const bibleBookSuffix = '.name';

  const {keys, duration, leastIndex, maxIndex, versesPerDay, buffer} =
    setScheduleParameters(dur, qryVerseIndex, scheduleType);

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
  ).then((res) => {
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
  let date = startDate;
  let versesToday = 0;
  let endCounter = 0;

  for (let i = 0; i < duration * 2; i++) {
    for (let k = 0; k < keys.length; k++) {
      if (i === 0) {
        k = keyIndex;
      }
      const key = keys[k];

      if (isEnd[key]) {
        log('Skipped day', key);
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
        log('day', key, 'ended at', i, 'days');
        endCounter++;
      }

      //Adjust the i index to represent a new schedule day if we have several types of days
      if (keys.length > 1 && k !== keys.length - 1) {
        i++;
      }
    }
    if (endCounter >= keys.length) {
      log('Schedule created lasts', i, 'days');
      break;
    }
  }

  return {readingPortions, adjustedVerseMessage};
}

/**
 * @param {DBQueryResult} weeklyReadingInfo
 * @param {Date} date
 * @returns {array} - Reading portions for schedule to be input into database
 */
export function generateWeeklyReadingSchedule(weeklyReadingInfo, date) {
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

  return portions;
}

/**
 * Given the correct information generates reading day items for input to a reading schedule
 * @param {Date} readingScheduleStartDate
 * @param {DBQueryResult} qryMemorialSchedules
 * @param {number} daytimeScheduleTitleID
 * @param {number} eveningScheduleTitleID
 * @returns {daytimeReadings: ReadingPortion[], eveningReadings: ReadingPortion[]}
 */
export function generateMemorialReadingSchedule(
  readingScheduleStartDate,
  qryMemorialSchedules,
  daytimeScheduleTitleID,
  eveningScheduleTitleID,
) {
  let daytimeReadings = [];
  let eveningReadings = [];
  let index = 0;
  let trackDate = new Date(readingScheduleStartDate);

  log('Started generating memorial reading schedule');

  for (let order = 0; order < 10; order++) {
    let isLooking = true;
    let checkNum = 0;

    log('day', order, 'index', index);
    log('daytimeReadings', daytimeReadings, 'eveningReadings', eveningReadings);

    while (isLooking || checkNum < 1000) {
      checkNum++;
      let item = qryMemorialSchedules.rows.item(index);

      if (!item) {
        break;
      }
      log('item', item, 'order', order);
      if (item.ScheduleOrder !== order) {
        isLooking = false;
        break;
      }

      index++;

      let startIndex = item.StartVerseID - 1;
      let endIndex = item.EndVerseID - 1;

      const {startPosition, endPosition} = checkStartAndEndPositions(
        tblVerseIndex,
        startIndex,
        endIndex,
      );

      log('day', order, 'dayStartIndex', startIndex, 'dayEndIndex', endIndex);

      let temp = createReadingPortion(
        tblVerseIndex,
        startIndex,
        startPosition,
        endIndex,
        endPosition,
        trackDate,
      );

      if (item.TitleID === daytimeScheduleTitleID) {
        daytimeReadings.push(temp);
      } else if (item.TitleID === eveningScheduleTitleID) {
        eveningReadings.push(temp);
      } else {
        console.error(
          'The title ID for the memorial schedule is not as expected it is',
          item.TitleID,
        );
      }
    }

    trackDate.setDate(trackDate.getDate() + 1);
  }

  return {daytimeReadings, eveningReadings};
}

/**
 * Creates a schedule for reading a publication such as a book or magazine breaking it up by user specified "portions" (Article, Page, Chapter, etc.)
 * @param {number} startingPortion - (Must be between 0 and 1,000,000,000,000,000) The portion to begin the schedule from
 * @param {number} maxPortion - The number of the last portion in the publication
 * @param {string} readingPortionDesc - A user provided description of the sections to break up their reading by
 * @param {number} portionsPerDay - How many portions to read each day
 */
export function generateCustomSchedule(
  startingPortion,
  maxPortion,
  readingPortionDesc,
  portionsPerDay,
  startDate = new Date(),
) {
  log('started creating schedule');

  portionsPerDay = parseFloat(portionsPerDay, 10);
  maxPortion = parseFloat(maxPortion, 10);

  let date = startDate;
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

  return readingPortions;
}

//------------------------------------------- Other Logic -------------------------------------------

/**
 * Given the neccessary information returns true or false if the weekly reading should be skipped for the week of the memorial
 * @param {0|1|2|3|4|5|6} resetDayOfWeek
 * @param {Date} upcomingMemorialDate
 * @param {Date} weeklyReadingStartDate
 * @returns {boolean}
 */
export function checkIfShouldSkipWeeklyReadingForMemorial(
  resetDayOfWeek,
  upcomingMemorialDate,
  weeklyReadingStartDate,
) {
  let today = new Date();
  let weekToSkip = new Date(upcomingMemorialDate);
  let memorialDay = weekToSkip.getDay();

  if (memorialDay === 0 || memorialDay === 6) {
    return false;
  }

  let weeklyReadingResetOffset = resetDayOfWeek - memorialDay;
  weekToSkip.setDate(weekToSkip.getDate() - 7 + weeklyReadingResetOffset);

  if (today.getTime() < weekToSkip.getTime()) {
    return false;
  }

  let weekAfterWeekToSkip = new Date(weekToSkip);
  weekAfterWeekToSkip.setDate(weekAfterWeekToSkip.getDate() + 7);

  if (
    today.getTime() > weekAfterWeekToSkip.getTime() &&
    weeklyReadingStartDate.getTime() >= upcomingMemorialDate.getTime()
  ) {
    return false;
  }

  return true;
}

/**
 * @param {Date} memorialDate
 * @returns {Date}
 */
export function getNewWeeklyReadingStartDateFromSkippedMemorialDate(
  memorialDate,
) {
  //We want to set this to a monday since that's the day of the week that the weekly reading actually starts
  let newWeeklyReadingStartDate = new Date(memorialDate);
  let weekdayAdjustment = 8 - memorialDate.getDay();
  newWeeklyReadingStartDate.setDate(memorialDate.getDate() + weekdayAdjustment);

  return newWeeklyReadingStartDate;
}

/**
 * @param {Date} newWeeklyReadingStartDate
 * @param {Date} weeklyReadingStartDate
 * @param {number} startIndex
 * @returns {number}
 */
export function getWeeklyReadingIndexForMemorialWeek(
  newWeeklyReadingStartDate,
  weeklyReadingStartDate,
  startIndex,
) {
  //We have to subtract 1 from the total since we are skipping a week. That's the whole reason why we are doing this.
  let newIndex =
    getWeeksBetween(weeklyReadingStartDate, newWeeklyReadingStartDate) +
    startIndex -
    1;

  return newIndex;
}
