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

function checkVerseBuffer(query, endPortion, buffer) {
  let endChapter = endPortion.Chapter;
  let endVerse = endPortion.Verse;

  if (endVerse < buffer) {
    return 0 - endVerse;
  }

  for (let i = 0; i < query.length; i++) {
    const element = query.item(i);

    // console.log('element.BibleBook = ', element.BibleBook);
    // console.log('endPortion.BibleBook = ', endPortion.BibleBook);
    // console.log('element.Chapter = ', element.Chapter);
    // console.log('element.Chapter = ', endChapter);

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
      const versesPerDay = Math.floor(totalVerses / duration);
      const buffer = versesPerDay / 10 + 1;
      var temp = [];

      let startBibleBook;
      let startChapter;
      let startVerse;
      let endBibleBook;
      let endChapter;
      let endVerse;

      const sql = `SELECT VerseID FROM tblVerseIndex 
      WHERE BibleBook = ${bookId} AND Chapter = ${chapter} AND Verse = ${verse};`;

      txn.executeSql(sql, [], (txn, res) => {
        let pointer = res.rows.item(0).VerseID - 1;
        const startIndex = pointer;
        let hasLooped = false;

        for (let i = 0; i < duration; i++) {
          let tempString = '';
          let isEnd = false;

          startBibleBook = tblVerseIndex.rows.item(pointer).BookName;
          startChapter = tblVerseIndex.rows.item(pointer).Chapter;
          startVerse = tblVerseIndex.rows.item(pointer).Verse;

          pointer += versesPerDay;

          if (!hasLooped) {
            if (pointer >= tblVerseIndex.rows.length - 1) {
              pointer -= tblVerseIndex.rows.length - 1;
              hasLooped = true;
              if (pointer >= startIndex - 1) {
                pointer = startIndex - 1;
                isEnd = true;
              }
            }
          } else {
            if (pointer >= startIndex - 1) {
              pointer = startIndex - 1;
              isEnd = true;
            }
          }

          pointer += checkVerseBuffer(
            query.rows,
            tblVerseIndex.rows.item(pointer),
            buffer,
          );

          endBibleBook = tblVerseIndex.rows.item(pointer).BookName;
          endChapter = tblVerseIndex.rows.item(pointer).Chapter;
          endVerse = tblVerseIndex.rows.item(pointer).Verse;

          tempString = `${startBibleBook} ${startChapter}:${startVerse} - ${endBibleBook} ${endChapter}:${endVerse}`;

          temp.push(tempString);

          pointer += 1;
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
