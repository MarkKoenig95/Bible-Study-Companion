db.transaction(function(txn) {
  txn.executeSql(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='tblBibleBooks'",
    [],
    function(tx, res) {
      console.log('item:', res.rows.length);
      if (res.rows.length !== 0) {
        txn.executeSql('SELECT * FROM tblBibleBooks', [], (txn, results) => {
          var temp = [];

          for (let i = 0; i < results.rows.length; ++i) {
            temp.push(results.rows.item(i));
          }
          setState({
            FlatListItems: temp,
          });
        });
      }
    },
  );
});
