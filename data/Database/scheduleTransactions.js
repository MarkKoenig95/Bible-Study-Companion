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

const prefix = 'scheduleTransactions.';

let qryMaxChapters;
let qryMaxVerses;
let tblVerseIndex;

export function deleteSchedule(db, tableName, scheduleName) {
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

export function updateReadStatus(db, tableName, id, status) {
  db.transaction(txn => {
    let sql = `UPDATE ${tableName}
    SET IsFinished = ${status}
    WHERE ReadingDayID=${id};`;
    txn.executeSql(sql, []);
  }).catch(errorCB);
}

export function updateDailyText(userDB, date) {
  userDB
    .transaction(txn => {
      let sql = `UPDATE tblDates
                  SET Date = ?
                  WHERE Name="DailyText";`;
      txn.executeSql(sql, [date]);
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
      .then(([txn, res]) => {
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

export async function runQueries(bibleDB) {
  if (!tblVerseIndex) {
    let sql = `SELECT BookName, Verse, Chapter, BibleBook
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
}

export async function addSchedule(
  userDB,
  bibleDB,
  scheduleName,
  duration,
  bookId,
  chapter,
  verse,
  successCallBack,
  errorCallBack,
) {
  log(
    `______________________ New Schedule named ${scheduleName} ______________________`,
  );
  timeKeeper('Started at...');

  if (!qryMaxVerses || !tblVerseIndex) {
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
            'INSERT INTO tblSchedules (ScheduleName, HideCompleted) VALUES (?, 0)',
            [scheduleName],
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

    await userDB
      .transaction(txn => {
        //Create a table for this new schedule based on the formated name
        txn
          .executeSql(
            `CREATE TABLE IF NOT EXISTS ${tableName}
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
                IsFinished BOOLEAN DEFAULT 0)`,
            [],
          )
          .then(() => {
            log('Table', tableName, 'created successfully');

            //Populate the table with reading information
            generateSequentialSchedule(
              userDB,
              bibleDB,
              duration,
              bookId,
              chapter,
              verse,
              tableName,
              successCallBack,
              errorCallBack,
            );
          });
      })
      .catch(errorCB);
  } else {
    errorCallBack(translate(prefix + 'scheduleNameTakenPrompt'));
  }
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

async function findVerseIndex(bibleDB, bookId, chapter, verse, isFirstTime) {
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
          index = res.rows.item(0).VerseID - 1;
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
    index = await findVerseIndex(bibleDB, ...nearestVerse);
  }

  return index;
}

function checkVerseBuffer(endPortion, buffer) {
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

// Declaring values to be input into schedule table here for easier understanding of structure.
// Values to be used later in schedule Generator
const valuesArray = [
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

async function generateSequentialSchedule(
  userDB,
  bibleDB,
  duration,
  bookId,
  chapter,
  verse,
  tableName,
  successCB,
  messageCB,
) {
  //Get all required table and query references to be used in populating the table
  log('tblVerseIndex:', tblVerseIndex, 'qryMaxVerses:', qryMaxVerses);

  //Transform the duration into an amount of days based on the years given by user
  /*
  Apparently, though (I assume because of truncating of decimal places) the schedules get farther
  and farther off target the more years they run, thus the "+ duration * 7" adjustment.
  It matches the target numbers well even all the way up to a 7 year schedule.
  */
  duration = parseFloat(duration, 10);
  duration *= 365 + duration * 7;

  const totalVerses = tblVerseIndex.rows.length;
  const maxIndex = tblVerseIndex.rows.length - 1;
  const versesPerDay = totalVerses / duration;
  const bibleBookPrefix = 'bibleBooks.';
  const bibleBookSuffix = '.name';

  let tempBuffer = versesPerDay / 4;

  const buffer = Math.round(tempBuffer);

  let readingPortions = [];

  let startBookNumber;
  let startBibleBook;
  let startChapter;
  let startVerse;
  let endBookNumber;
  let endBibleBook;
  let endChapter;
  let endVerse;

  let tempPointer = searchQuery(qryMaxVerses, 'BibleBook', bookId);

  let initialBookNumber = qryMaxVerses.rows.item(tempPointer).BibleBook;
  let initialBibleBook = translate(
    bibleBookPrefix + initialBookNumber + bibleBookSuffix,
  );
  let initialChapter = chapter;
  let initialVerse = verse;

  let adjustedVerseMessage;

  log('Starting schedule generation');

  let pointer = await findVerseIndex(bibleDB, bookId, chapter, verse, true);

  const startIndex = pointer;
  var endIndex = startIndex - 1;
  let hasLooped = false;

  log('pointer', pointer);
  startBookNumber = tblVerseIndex.rows.item(pointer).BibleBook;
  startBibleBook = translate(
    bibleBookPrefix + startBookNumber + bibleBookSuffix,
  );
  startChapter = tblVerseIndex.rows.item(pointer).Chapter;
  startVerse = tblVerseIndex.rows.item(pointer).Verse;

  let date = new Date();

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

  let verseOverflow = 0;
  let versesToday = 0;

  for (let i = 0; i < duration * 2; i++) {
    let tempString = '';
    let isEnd = false;

    startBookNumber = tblVerseIndex.rows.item(pointer).BibleBook;
    startBibleBook = translate(
      bibleBookPrefix + startBookNumber + bibleBookSuffix,
    );
    startChapter = tblVerseIndex.rows.item(pointer).Chapter;
    startVerse = tblVerseIndex.rows.item(pointer).Verse;

    log(
      'Generating Sequential schedule starting at: ',
      startBibleBook,
      startChapter,
      ':',
      startVerse,
    );

    versesToday = versesPerDay + verseOverflow;

    verseOverflow = versesToday - Math.floor(versesToday);

    pointer += Math.round(versesToday);

    if (!hasLooped) {
      if (pointer >= maxIndex) {
        pointer -= maxIndex;
        hasLooped = true;
        if (pointer >= endIndex - buffer) {
          pointer = endIndex;
          isEnd = true;
        }
      }
    } else {
      if (pointer >= endIndex - buffer) {
        pointer = endIndex;
        isEnd = true;
      }
    }

    if (!isEnd) {
      let verseBuffer = checkVerseBuffer(
        tblVerseIndex.rows.item(pointer),
        buffer,
      );

      verseOverflow -= verseBuffer;

      pointer += Math.round(verseBuffer);
    }

    if (!hasLooped) {
      if (pointer >= maxIndex) {
        pointer -= maxIndex;
        hasLooped = true;
        if (pointer >= endIndex - buffer) {
          pointer = endIndex;
          isEnd = true;
        }
      }
    } else {
      if (pointer >= endIndex - buffer) {
        pointer = endIndex;
        isEnd = true;
      }
    }

    if (pointer < 0 || pointer > maxIndex) {
      pointer = maxIndex;
    }

    endBookNumber = tblVerseIndex.rows.item(pointer).BibleBook;
    endBibleBook = translate(bibleBookPrefix + endBookNumber + bibleBookSuffix);
    endChapter = tblVerseIndex.rows.item(pointer).Chapter;
    endVerse = tblVerseIndex.rows.item(pointer).Verse;

    log('And ending at: ', endBibleBook, endChapter, ':', endVerse);

    tempString = `${startBibleBook} ${startChapter}:${startVerse} - ${endBibleBook} ${endChapter}:${endVerse}`;

    log(tempString);

    let temp = createReadingPortionArray(
      startBibleBook,
      startBookNumber,
      startChapter,
      startVerse,
      endBibleBook,
      endBookNumber,
      endChapter,
      endVerse,
      date,
      tempString,
    );
    date.setDate(date.getDate() + 1);

    readingPortions.push(temp);

    pointer += 1;

    log(
      'pointer',
      pointer,
      'isEnd',
      isEnd,
      'hasLooped',
      hasLooped,
      'maxIndex',
      maxIndex,
    );

    if (pointer > maxIndex) {
      pointer = 0;
    }

    if (isEnd) {
      console.log('Schedule created lasts', i, 'days');
      break;
    }
  }

  timeKeeper('Ended at.....');

  let placeholders = createPlaceholdersFromArray(readingPortions);

  let temp = [];

  readingPortions.map(innerArray => {
    innerArray.map(value => temp.push(value));
  });

  readingPortions = temp;

  let sql = `INSERT INTO ${tableName} (${valuesArray}) VALUES ${placeholders}`;

  userDB
    .transaction(txn => {
      txn.executeSql(sql, readingPortions, (tx, results) => {
        if (results.rowsAffected > 0) {
          console.log('Insert success');
          if (adjustedVerseMessage) {
            messageCB(adjustedVerseMessage);
          }
          successCB();
        } else {
          console.log('Insert failed');
        }
      });
    })
    .catch(errorCB);
}

function generateScheduleList(userDB) {
  /**
   * have a general function to create user prefs table. this way whenever I need to make
   * an adjustment I only have to look to one place to fix it
   *
   * day's text is not really a schedule thing. just a value stored in the userPrefs table
   * which says the last date when the day's text was read. If it is not today,
   * then we display the day's text reading portion button
   *
   * Loop through all schedules and make a schedule day button instance
   * for each if it matched today and has not been read
   *
   * How should magazine readings be handled? we could have a monthly reading section and just
   * check it off when you finish (alternatively, we could have it open a popup which can allow
   * you to set what page you have read up to? or split it into 32 or 16 buttons, one for each
   * page (need to take care of combining first and second, and second to last and last into
   * their own days)), or you could have a daily reading which tells you how many pages to read
   * for the day, start with public awake / wt, then once that is finished read the current study
   * edition. This will definitely have to have settings
   */
}
