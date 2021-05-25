import {ScheduleType} from '../../logic/general';

export interface Database {
  dbname: any;
  executeSql: Function;
  sqlBatch: (arg0: any[]) => Promise<any>;
}

export interface DBQueryResult {
  rows: {
    length: number;
    item: (index: number) => any;
  };
}

export interface ReadingScheduleItem {
  ReadingDayID: number;
  CompletionDate: string;
  doesTrack: boolean;
  StartBookName?: string;
}

export interface ScheduleInfo {
  ScheduleID: number;
  ScheduleName: string;
  ScheduleType: ScheduleType;
  StartDate: string;
  DoesTrack: 0 | 1;
  CreationInfo: {
    duration?: number;
    bookId?: number;
    chapter?: number;
    verse?: number;
    readingPortionDesc?: string;
    startingPortion?: number;
    maxPortion?: number;
    portionsPerDay?: number;
  };
  IsDay0Active: 0 | 1;
  IsDay1Active: 0 | 1;
  IsDay2Active: 0 | 1;
  IsDay3Active: 0 | 1;
  IsDay4Active: 0 | 1;
  IsDay5Active: 0 | 1;
  IsDay6Active: 0 | 1;
}
