import {log, timeKeeper, searchQuery} from './generalTransactions';

export function deleteSchedule(db, tableName, scheduleName) {
  db.transaction(txn => {
    txn.executeSql(
      `DELETE FROM tblSchedules WHERE ScheduleName='${scheduleName}'`,
      [],
    );

    txn.executeSql(`DROP TABLE IF EXISTS  ${tableName}`, [], () => {
      console.log('Deleted table ', tableName);
    });
  });
}

export function clearSchedules(txn) {
  txn.executeSql('SELECT * FROM tblSchedules', [], (txn, res) => {
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
  });
}

export function formatTableName(scheduleName) {
  let tableName = 'tbl';

  tableName += scheduleName.replace(/\s/g, '');

  return tableName;
}

export function addSchedule(
  db,
  scheduleName,
  duration,
  bookId,
  chapter,
  verse,
  tblVerseIndex,
  qryMaxVerses,
  successCallBack,
  errorCallBack,
) {
  timeKeeper('Started at...');

  db.transaction(txn => {
    txn.executeSql(
      'CREATE TABLE IF NOT EXISTS tblSchedules(ScheduleID INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE, ScheduleName VARCHAR(20) UNIQUE)',
      [],
    );

    //Check if a schedule with that name already exists
    txn.executeSql(
      `SELECT 1 FROM tblSchedules WHERE ScheduleName = "${scheduleName}"`,
      [],
      (txn, res) => {
        if (res.rows.length < 1) {
          log('Creating schehdule table');
          //If it doesn't already exist, add a value to the schedules table with correlating info
          txn.executeSql(
            `INSERT INTO tblSchedules (ScheduleName) VALUES ('${scheduleName}')`,
            [],
          );

          log('Formatting table name');
          //Format a name for the new table to be created for this schedule
          let tableName = formatTableName(scheduleName);

          //Create a table for this new schedule based on the formated name
          txn.executeSql(
            `CREATE TABLE IF NOT EXISTS ${tableName}
              (ReadingDayID INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE, 
              ReadingPortion VARCHAR(20), 
              IsFinished BOOLEAN)`,
            [],
          );
          log('Table created successfully');

          //Populate the table with reading information
          generateSequentialSchedule(
            txn,
            duration,
            bookId,
            chapter,
            verse,
            tableName,
            tblVerseIndex,
            qryMaxVerses,
            successCallBack,
            errorCallBack,
          );
        } else {
          errorCallBack("Please select a schedule name you haven't used");
        }
      },
    );
  }, errorCallBack);
}

function findNearestVerse(qryMaxVerses, bookId, chapter, verse) {
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

function findMaxChapter(qryMaxChapters, bookId) {
  let index = searchQuery(qryMaxChapters, 'BibleBook', bookId);

  return qryMaxChapters.rows.item(index).MaxChapter;
}

function findVerseIndex(
  txn,
  qryMaxVerses,
  bookId,
  chapter,
  verse,
  cb,
  isFirstTime,
) {
  //Obtain max chapters info
  txn.executeSql(
    'SELECT BibleBook, MaxChapter FROM qryMaxChapters',
    [],
    (txn, qryMaxChapters) => {
      const sql = `SELECT VerseID FROM tblVerseIndex 
        WHERE BibleBook = ${bookId} AND Chapter = ${chapter} AND Verse = ${verse};`;
      //Find index in table for specific verse
      txn.executeSql(sql, [], (txn, res) => {
        var index = 0;
        //If there is no such verse, then we have to adjust
        //(Make sure the recurssive call only runs twice too)
        if (res.rows.length < 1 && isFirstTime) {
          //First check if the chapter is out of bounds and adjust. This makes later processses easier
          let maxChapter = findMaxChapter(qryMaxChapters, bookId);

          if (chapter > maxChapter) {
            chapter = maxChapter;
          }

          //Find the verse which most closely matches the one which was requested
          let nearestVerse = findNearestVerse(
            qryMaxVerses,
            bookId,
            chapter,
            verse,
          );

          log('Nearest verse:', ...nearestVerse);

          //With a new adjusted verse let's search again to see what the index for this verse is
          index = findVerseIndex(txn, qryMaxVerses, ...nearestVerse, res =>
            cb(res),
          );
        } else {
          //The verse searched for exists
          cb(res);
        }
      });
    },
  );
}

function checkVerseBuffer(qryMaxVerses, endPortion, buffer) {
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

function generateSequentialSchedule(
  txn,
  duration,
  bookId,
  chapter,
  verse,
  tableName,
  tblVerseIndex,
  qryMaxVerses,
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
  duration = parseInt(duration);
  let initialDuration = duration;
  duration *= 365 + duration * 7;
  // duration -= initialDuration;
  // duration = newDuration;
  console.log(duration);

  const totalVerses = tblVerseIndex.rows.length;
  const maxIndex = tblVerseIndex.rows.length - 1;
  const versesPerDay = totalVerses / duration;

  let tempBuffer = versesPerDay / 4;

  const buffer = Math.round(tempBuffer);

  var temp = [];

  let startBibleBook;
  let startChapter;
  let startVerse;
  let endBibleBook;
  let endChapter;
  let endVerse;

  let tempPointer = searchQuery(qryMaxVerses, 'BibleBook', bookId);

  let initialBibleBook = qryMaxVerses.rows.item(tempPointer).BookName;
  let initialChapter = chapter;
  let initialVerse = verse;

  let adjustedVerseMessage;

  log('Starting schedule generation');

  findVerseIndex(
    txn,
    qryMaxVerses,
    bookId,
    chapter,
    verse,
    res => {
      let pointer = res.rows.item(0).VerseID - 1;
      const startIndex = pointer;
      var endIndex = startIndex - 1;
      let hasLooped = false;

      startBibleBook = tblVerseIndex.rows.item(pointer).BookName;
      startChapter = tblVerseIndex.rows.item(pointer).Chapter;
      startVerse = tblVerseIndex.rows.item(pointer).Verse;

      if (
        startBibleBook != initialBibleBook ||
        startChapter != initialChapter ||
        startVerse != initialVerse
      ) {
        adjustedVerseMessage = `Adjusted start verse from ${initialBibleBook} ${initialChapter}:${initialVerse} to ${startBibleBook} ${startChapter}:${startVerse} because initial request was out of bounds.`;
      }

      let verseOverflow = 0;
      let versesToday = 0;

      for (let i = 0; i < duration * 2; i++) {
        let tempString = '';
        let isEnd = false;

        startBibleBook = tblVerseIndex.rows.item(pointer).BookName;
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
            qryMaxVerses,
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

        endBibleBook = tblVerseIndex.rows.item(pointer).BookName;
        endChapter = tblVerseIndex.rows.item(pointer).Chapter;
        endVerse = tblVerseIndex.rows.item(pointer).Verse;

        log('And ending at: ', endBibleBook, endChapter, ':', endVerse);

        tempString = `${startBibleBook} ${startChapter}:${startVerse} - ${endBibleBook} ${endChapter}:${endVerse}`;

        log(tempString);

        temp.push(tempString);

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
          //////////////////////////////
          console.log(i);
          break;
        }
      }

      let readingPortions = temp;
      let placeholders = readingPortions.map(() => '(?)').join(',');

      timeKeeper('Ended at.....');

      txn.executeSql(
        `INSERT INTO ${tableName} (ReadingPortion) VALUES ${placeholders}`,
        readingPortions,
        () => {
          if (adjustedVerseMessage) {
            messageCB(adjustedVerseMessage);
          }
          successCB();
        },
      );
    },
    true,
  );
}
