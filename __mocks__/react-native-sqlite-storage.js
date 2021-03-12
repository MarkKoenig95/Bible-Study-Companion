const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

function openDatabase(dbName) {
  const dbPath = path.resolve(__dirname, '..', '___temp', dbName);

  const DB = new sqlite3.Database(dbPath, err => {
    if (err) {
      return console.error(err.message);
    }
  });

  async function executeSql(query, args) {
    const request = new Promise((resolve, reject) => {
      DB.all(query, args, (err, res) => {
        if (err) {
          reject(err);
        }
        resolve(res);
      });
    });

    let data = await request;

    let result = {
      rowsAffected: 1,
      rows: {length: data.length, item: index => data[index]},
    };

    return [result];
  }

  async function sqlBatch(statements) {
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      await executeSql(statement[0]);
    }
  }

  function deleteDB() {
    try {
      fs.unlinkSync(dbPath);
    } catch (err) {
      console.error(err);
    }
  }

  return {
    executeSql,
    deleteDB,
    sqlBatch,
  };
}

const SQLite = {
  enablePromise: jest.fn,
  DEBUG: jest.fn,
  openDatabase: openDatabase,
};

export default SQLite;
