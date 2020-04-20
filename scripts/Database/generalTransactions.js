import {log} from 'react-native-reanimated';

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

  var checkBookFunction = index => {
    let found;
    let isHigh;
    let idAtIndex = query.item(index).BibleBook;

    if (idAtIndex > bookID) {
      isHigh = true;
    } else if (idAtIndex < bookID) {
      isHigh = false;
    } else {
      found = true;
    }

    return [isHigh, found];
  };

  [index, startPointer, endPointer] = searchQuery(
    startPointer,
    endPointer,
    checkBookFunction,
  );

  var checkChapterFunction = index => {
    let found;
    let isHigh;
    let idAtIndex = query.item(index).Chapter;

    if (idAtIndex > chapter) {
      isHigh = true;
    } else if (idAtIndex < chapter) {
      isHigh = false;
    } else {
      found = true;
    }

    return [isHigh, found];
  };

  [index, startPointer, endPointer] = searchQuery(
    startPointer,
    endPointer,
    checkChapterFunction,
  );

  let verseAtIndex = query.item(index).Verse;

  if (verse > verseAtIndex) {
    verse = verseAtIndex;
  }

  chapter = query.item(index).Chapter;
  bookID = query.item(index).BibleBook;

  return [bookID, chapter, verse];
}

function searchQuery(startPointer, endPointer, checkFunction) {
  var index = 0;
  var safetyCheck = 0;
  var found = false;

  while (!found || safetyCheck > 50000) {
    let isHigh;
    index = (startPointer + endPointer) / 2;

    [isHigh, found] = checkFunction(index);

    if (isHigh) {
      endPointer = index;
    } else {
      startPointer = index;
    }
    safetyCheck++;

    console.log(
      'found: ',
      found,
      ' index: ',
      index,
      ' startPointer: ',
      startPointer,
      ' endPointer: ',
      endPointer,
    );
  }

  return [index, startPointer, endPointer];
}

function findVerseIndex(
  txn,
  query,
  bookId,
  chapter,
  verse,
  cb,
  isNotFirstTime,
) {
  const sql = `SELECT VerseID FROM tblVerseIndex 
      WHERE BibleBook = ${bookId} AND Chapter = ${chapter} AND Verse = ${verse};`;

  txn.executeSql(sql, [], (txn, res) => {
    var index = 0;
    if (res.rows.length < 1 && !isNotFirstTime) {
      index = findVerseIndex(
        query,
        ...findNearestVerse(
          txn,
          query,
          bookId,
          chapter,
          verse,
          res => cb(res),
          true,
        ),
      );
      console.log('In here index is: ', index);
    }
    cb(res);
  });
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

      findVerseIndex(txn, query, bookId, chapter, verse, res => {
        let pointer = res.rows.item(0).VerseID - 1;
        const startIndex = pointer;
        var endIndex = startIndex - 1;
        endIndex = endIndex > 0 ? endIndex : maxIndex;
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
      });
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
