function errorCB(err) {
  console.log('SQL Error: ' + err.message);
}

function openTable(db, tableName, cb) {
  db.transaction(function(txn) {
    txn.executeSql(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`,
      [],
      cb,
    );
  }, errorCB);
}

function deleteSchedule(db, tableName, scheduleName) {
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

function clearSchedules(txn) {
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

function timeKeeper(message) {
  let time = new Date();
  console.log(message, time);
}

function updateReadStatus(db, tableName, id, status) {
  db.transaction(txn => {
    let sql = `UPDATE ${tableName}
    SET IsFinished = ${status}
    WHERE ReadingDayID=${id};`;
    txn.executeSql(sql, []);
  });
}

function formatTableName(scheduleName) {
  let tableName = 'tbl';

  tableName += scheduleName.replace(/\s/g, '');

  return tableName;
}

function addSchedule(
  db,
  scheduleName,
  duration,
  bookId,
  chapter,
  verse,
  successCallBack,
  errorCallBack,
) {
  ///////////////////////////
  timeKeeper('Started at...');
  ////////////////////////////
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
          //If it doesn't already exist, add a value to the schedules table with correlating info
          txn.executeSql(
            `INSERT INTO tblSchedules (ScheduleName) VALUES ('${scheduleName}')`,
            [],
          );

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

          //Populate the table with reading information
          generateSequentialSchedule(
            txn,
            duration,
            bookId,
            chapter,
            verse,
            tableName,
            successCallBack,
          );
        } else {
          errorCallBack("Please select a schedule name you haven't used");
        }
      },
    );
  }, errorCallBack);
}

function listAllTables(db, cb) {
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

function findNearestVerse(qryMaxVerses, bookId, chapter, verse) {
  var startPointer = 0;
  var endPointer = qryMaxVerses.rows.length;
  let index = 0;

  console.log('bookId:', bookId, 'chapter:', chapter, 'verse:', verse);

  index = searchQuery(
    startPointer,
    endPointer,
    qryMaxVerses,
    'BibleBook',
    bookId,
    'Chapter',
    chapter,
  );

  let verseAtIndex = qryMaxVerses.rows.item(index).MaxVerse;

  if (verse > verseAtIndex) {
    index++;
    verse = 1;
  }

  chapter = qryMaxVerses.rows.item(index).Chapter;
  bookId = qryMaxVerses.rows.item(index).BibleBook;

  return [bookId, chapter, verse];
}

function searchQuery(
  startPointer,
  endPointer,
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

  while (!found && safetyCheck < safetyBoundary) {
    let isHigh;
    prevIndex = index;

    index = (startPointer + endPointer) / 2;
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

  return index;
}

function findMaxChapter(qryMaxChapters, bookId) {
  var startPointer = 0;
  var endPointer = qryMaxChapters.rows.length;

  let index = searchQuery(
    startPointer,
    endPointer,
    qryMaxChapters,
    'BibleBook',
    bookId,
  );

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

function checkVerseBuffer(query, endPortion, buffer) {
  let endChapter = endPortion.Chapter;
  let endVerse = endPortion.Verse;

  if (endVerse < buffer) {
    return 0 - endVerse;
  }

  // replace below with this function
  // searchQuery(startPointer, endPointer, checkFunction);

  for (let i = 0; i < query.length; i++) {
    const element = query.item(i);

    if (
      element.BibleBook === endPortion.BibleBook &&
      element.Chapter === endChapter
    ) {
      let difference = element.MaxVerse - endVerse;
      if (difference < buffer) {
        return difference;
      }
      return 0;
    }
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
  cb,
) {
  const sql = `SELECT BookName, Verse, Chapter, ChapterMax, BibleBook
                FROM tblVerseIndex
                INNER JOIN tblBibleBooks on tblBibleBooks.BibleBookID = tblVerseIndex.BibleBook;`;
  //Get all required table and query references to be used in populating the table
  txn.executeSql(sql, [], (txn, tblVerseIndex) => {
    txn.executeSql('SELECT * FROM qryMaxVerses', [], (txn, qryMaxVerses) => {
      duration *= 365;
      const totalVerses = tblVerseIndex.rows.length;
      const maxIndex = tblVerseIndex.rows.length - 1;
      const versesPerDay = Math.floor(totalVerses / duration);
      const buffer = versesPerDay / 10 + 1;
      var temp = [];

      let startBibleBook;
      let startChapter;
      let startVerse;
      let endBibleBook;
      let endChapter;
      let endVerse;

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

          for (let i = 0; i < duration; i++) {
            let tempString = '';
            let isEnd = false;

            startBibleBook = tblVerseIndex.rows.item(pointer).BookName;
            startChapter = tblVerseIndex.rows.item(pointer).Chapter;
            startVerse = tblVerseIndex.rows.item(pointer).Verse;

            pointer += versesPerDay;

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
              pointer += checkVerseBuffer(
                qryMaxVerses.rows,
                tblVerseIndex.rows.item(pointer),
                buffer,
              );
            }

            if (pointer < 0) {
              pointer = maxIndex;
            }

            endBibleBook = tblVerseIndex.rows.item(pointer).BookName;
            endChapter = tblVerseIndex.rows.item(pointer).Chapter;
            endVerse = tblVerseIndex.rows.item(pointer).Verse;

            tempString = `${startBibleBook} ${startChapter}:${startVerse} - ${endBibleBook} ${endChapter}:${endVerse}`;

            temp.push(tempString);

            pointer += 1;

            if (hasLooped && pointer > maxIndex) {
              pointer = 0;
            }
            if (isEnd) {
              break;
            }
          }

          let readingPortions = temp;
          let placeholders = readingPortions.map(() => '(?)').join(',');

          ///////////////////////////
          timeKeeper('Ended at...');
          ////////////////////////////

          txn.executeSql(
            `INSERT INTO ${tableName} (ReadingPortion) VALUES ${placeholders}`,
            readingPortions,
            cb,
          );
        },
        true,
      );
    });
  });
}

export {
  openTable,
  addSchedule,
  listAllTables,
  deleteSchedule,
  updateReadStatus,
  formatTableName,
};
