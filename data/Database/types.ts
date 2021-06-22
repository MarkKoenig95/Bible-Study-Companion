import {ScheduleType, VersePosition} from '../../logic/general';

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

export interface DBReadingItem {
  CompletionDate: string;
  IsFinished: 0 | 1;
  ReadingDayID: number;
  ReadingPortion: string;
}

export interface DBBibleReadingItem extends DBReadingItem {
  EndBookNumber: number;
  EndBookName: string;
  EndChapter: number;
  EndVerse: number;
  StartBookNumber: number;
  StartBookName: string;
  StartChapter: number;
  StartVerse: number;
  VersePosition: VersePosition;
}

export interface ReadingItem {
  completedHidden: boolean;
  completionDate: Date;
  doesTrack: boolean;
  isFinished: boolean;
  readingDayID: number;
  onLongPress: () => void;
  onPress: () => void;
  tableName: string;
  title: string;
  type?: string;
  readingPortion: string;
  updateValue: number;
}

export interface BibleReadingItem extends ReadingItem {
  endBookNumber: number;
  endBookName: string;
  endChapter: number;
  endVerse: number;
  startBookNumber: number;
  startBookName: string;
  startChapter: number;
  startVerse: number;
  versePosition: VersePosition;
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
