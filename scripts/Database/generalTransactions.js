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
  successCallBack,
  errorCallBack,
) {
  db.transaction(txn => {
    txn.executeSql(
      'CREATE TABLE IF NOT EXISTS tblSchedules(ScheduleID INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE, ScheduleName VARCHAR(20) UNIQUE)',
      [],
    );

    txn.executeSql(
      `SELECT 1 FROM table_name WHERE unique_key = "${scheduleName}"`,
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

          generateSequentialSchedule(txn, duration, tableName, successCallBack);
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

function generateSequentialSchedule(txn, duration, tableName, cb) {
  const sql = `SELECT BookName, Verse, Chapter, ChapterMax, BibleBook
    FROM tblVerseIndex
    INNER JOIN tblBibleBooks on tblBibleBooks.BibleBookID = tblVerseIndex.BibleBook;`;
  txn.executeSql(sql, [], (txn, results) => {
    txn.executeSql('SELECT * FROM qryMaxVerses', [], (txn, query) => {
      duration *= 365;
      const totalVerses = results.rows.length;
      const versesPerDay = Math.floor(totalVerses / duration);
      const buffer = versesPerDay / 10 + 1;
      var temp = [];

      let startBibleBook;
      let startChapter;
      let startVerse;
      let endBibleBook;
      let endChapter;
      let endVerse;

      let pointer = 0;

      for (let i = 0; i < duration; i++) {
        let tempString = '';
        let flag = false;

        startBibleBook = results.rows.item(pointer).BookName;
        startChapter = results.rows.item(pointer).Chapter;
        startVerse = results.rows.item(pointer).Verse;

        pointer += versesPerDay;

        if (pointer > results.rows.length - 1) {
          pointer = results.rows.length - 1;
          flag = true;
        }

        pointer += checkVerseBuffer(
          query.rows,
          results.rows.item(pointer),
          buffer,
        );

        endBibleBook = results.rows.item(pointer).BookName;
        endChapter = results.rows.item(pointer).Chapter;
        endVerse = results.rows.item(pointer).Verse;

        tempString = `${startBibleBook} ${startChapter}:${startVerse} - ${endBibleBook} ${endChapter}:${endVerse}`;

        temp.push(tempString);

        pointer += 1;
        if (flag) {
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
}

export {
  openTable,
  addSchedule,
  listAllTables,
  deleteSchedule,
  updateReadStatus,
  formatTableName,
};
