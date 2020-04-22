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
  db.transaction(txn => {
    txn.executeSql(
      'CREATE TABLE IF NOT EXISTS tblSchedules(ScheduleID INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE, ScheduleName VARCHAR(20) UNIQUE)',
      [],
    );

    txn.executeSql(
      `SELECT 1 FROM tblSchedules WHERE ScheduleName = "${scheduleName}"`,
      [],
      (txn, res) => {
        if (res.rows.length < 1) {
          txn.executeSql(
            `INSERT INTO tblSchedules (ScheduleName) VALUES ('${scheduleName}')`,
            [],
          );

          let tableName = formatTableName(scheduleName);

          txn.executeSql(
            `CREATE TABLE IF NOT EXISTS ${tableName}(ReadingDayID INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE, ReadingPortion VARCHAR(20), IsFinished BOOLEAN)`,
            [],
          );
          try {
            generateSequentialSchedule(
              txn,
              duration,
              bookId,
              chapter,
              verse,
              tableName,
              successCallBack,
            );
          } catch {
            e => console.log(e);
          }
        } else {
          errorCallBack({
            message: "Please select a schedule name you haven't used",
          });
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

function findNearestVerse(query, bookID, chapter, verse) {
  var startPointer = 0;
  var endPointer = query.length;

  var index = 0;

  var checkFunction = index => {
    let found;
    let isHigh;
    let chapterAtIndex = query.item(index).Chapter;
    let bookIdAtIndex = query.item(index).BibleBook;

    console.log(
      'chapter:',
      chapter,
      'chapterAtIndex:',
      chapterAtIndex,
      'bookID:',
      bookID,
      'bookIdAtIndex:',
      bookIdAtIndex,
    );

    if (bookIdAtIndex > bookID) {
      isHigh = true;
    } else if (bookIdAtIndex < bookID) {
      isHigh = false;
    } else {
      if (chapterAtIndex > chapter) {
        isHigh = true;
      } else if (chapterAtIndex < chapter) {
        isHigh = false;
      } else {
        found = true;
      }
    }

    return [isHigh, found];
  };

  index = searchQuery(startPointer, endPointer, checkFunction);

  let verseAtIndex = query.item(index).MaxVerse;

  if (verse > verseAtIndex) {
    index++;
    verse = 1;
  }

  chapter = query.item(index).Chapter;
  bookID = query.item(index).BibleBook;

  return [bookID, chapter, verse];
}

function searchQuery(startPointer, endPointer, checkFunction) {
  var index = 0;
  var safetyCheck = 0;
  var safetyBoundary = 2000;
  var found = false;
  var prevIndex;

  while (!found && safetyCheck < safetyBoundary) {
    let isHigh;
    prevIndex = index;

    console.log(prevIndex);

    console.log('startPointer:', startPointer, 'endPointer:', endPointer);
    index = (startPointer + endPointer) / 2;
    index = index | 0;

    console.log(index);

    //Prevent endless loop when start and end pointers are only 1 apart
    if (index === prevIndex) {
      index++;
    }

    [isHigh, found] = checkFunction(index);

    if (isHigh) {
      endPointer = index;
    } else {
      startPointer = index;
    }
    safetyCheck++;

    /////////////////////////
    console.log(
      'found: ',
      found,
      ' index: ',
      index,
      ' startPointer: ',
      startPointer,
      ' endPointer: ',
      endPointer,
      'safetyCheck:',
      safetyCheck,
    );
    if (safetyCheck === safetyBoundary) {
      console.log('Exited with safety check');
    }
    //////////////////////////
  }

  return index;
}

function findMaxChapter(query, bookId) {
  var startPointer = 0;
  var endPointer = query.length;

  var index = 0;

  var checkFunction = index => {
    let found;
    let isHigh;
    let bookIdAtIndex = query.item(index).BibleBook;

    if (bookIdAtIndex > bookId) {
      isHigh = true;
    } else if (bookIdAtIndex < bookId) {
      isHigh = false;
    } else {
      found = true;
    }

    return [isHigh, found];
  };

  index = searchQuery(startPointer, endPointer, checkFunction);

  return query.item(index).MaxChapter;
}

function findVerseIndex(txn, query, bookId, chapter, verse, cb, isFirstTime) {
  txn.executeSql(
    'SELECT BibleBook, MaxChapter FROM qryMaxChapters',
    [],
    (txn, queryMaxChapters) => {
      const sql = `SELECT VerseID FROM tblVerseIndex 
        WHERE BibleBook = ${bookId} AND Chapter = ${chapter} AND Verse = ${verse};`;

      txn.executeSql(sql, [], (txn, res) => {
        var index = 0;
        if (res.rows.length < 1 && isFirstTime) {
          let maxChapter = findMaxChapter(queryMaxChapters.rows, bookId);
          if (chapter > maxChapter) {
            chapter = maxChapter;
          }

          index = findVerseIndex(
            txn,
            query,
            ...findNearestVerse(query, bookId, chapter, verse),
            res => cb(res),
          );
        } else {
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
  txn.executeSql(sql, [], (txn, tblVerseIndex) => {
    txn.executeSql('SELECT * FROM qryMaxVerses', [], (txn, query) => {
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
        query.rows,
        bookId,
        chapter,
        verse,
        res => {
          ///////////////////////////////////////////
          let tempThis = tblVerseIndex.rows.item(res.rows.item(0).VerseID - 1);
          console.log(
            'Searched for bookId',
            bookId,
            'chapter',
            chapter,
            'verse',
            verse,
            ' and found',
            tempThis.BookName,
            tempThis.BibleBook,
            tempThis.Chapter,
            tempThis.Verse,
          );
          ///////////////////////////////////////////

          let pointer = res.rows.item(0).VerseID - 1;
          const startIndex = pointer;
          var endIndex = startIndex - 1;
          let hasLooped = false;

          for (let i = 0; i < duration; i++) {
            let tempString = '';
            let isEnd = false;

            console.log('startIndex: ', startIndex, ' pointer: ', pointer);

            startBibleBook = tblVerseIndex.rows.item(pointer).BookName;
            startChapter = tblVerseIndex.rows.item(pointer).Chapter;
            startVerse = tblVerseIndex.rows.item(pointer).Verse;

            console.log(
              startBibleBook,
              ' ',
              startChapter,
              ':',
              startVerse,
              ' to...',
            );

            pointer += versesPerDay;

            console.log('Here 1 the pointer is: ', pointer);

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

            console.log('Here 2 the pointer is: ', pointer);

            if (!isEnd) {
              pointer += checkVerseBuffer(
                query.rows,
                tblVerseIndex.rows.item(pointer),
                buffer,
              );
            }

            if (pointer < 0) {
              pointer = maxIndex;
            }

            console.log('Here 3 the pointer is: ', pointer);

            endBibleBook = tblVerseIndex.rows.item(pointer).BookName;
            endChapter = tblVerseIndex.rows.item(pointer).Chapter;
            endVerse = tblVerseIndex.rows.item(pointer).Verse;

            console.log(endBibleBook, ' ', endChapter, ':', endVerse);

            tempString = `${startBibleBook} ${startChapter}:${startVerse} - ${endBibleBook} ${endChapter}:${endVerse}`;

            temp.push(tempString);

            console.log('isEnd: ', isEnd);
            console.log('hasLooped: ', hasLooped);

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
