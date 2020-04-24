import {
  openTable,
  addSchedule,
  listAllTables,
  deleteSchedule,
  updateReadStatus,
  formatTableName,
} from './generalTransactions';
import Database from './Database';

const db = Database.getConnection();
