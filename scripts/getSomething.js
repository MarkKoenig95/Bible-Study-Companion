import {openDatabase} from 'react-native-sqlite-storage';

var db = openDatabase({
  name: 'BibleStudyCompanion.db',
  createFromLocation: 1,
});

function getSomething() {
  db.transaction(function(txn) {
    txn.executeSql(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='tblBibleBooks'",
      [],
      function(tx, res) {
        console.log('item:', res.rows.length);
        if (res.rows.length === 0) {
          txn.executeSql('DROP TABLE IF EXISTS tblBibleBooks', []);
          txn.executeSql(
            'CREATE TABLE IF NOT EXISTS tblBibleBooks(BibleBookID INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE, BookName VARCHAR(20))',
            [],
          );
        }
        txn.executeSql('SELECT * FROM tblBibleBooks', [], (txn, results) => {
          var temp = [];
          console.log(results);

          for (let i = 0; i < results.rows.length; ++i) {
            temp.push(results.rows.item(i));
          }
          setState({
            FlatListItems: temp,
          });
        });
      },
    );
  });
}

export default getSomething;
