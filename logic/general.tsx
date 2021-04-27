// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, {useCallback} from 'react';
import {Linking, Platform} from 'react-native';
import {runSQL} from '../data/Database/generalTransactions';
import {
  formatScheduleTableName,
  recreateSchedule,
} from '../data/Database/scheduleTransactions';
import {
  Database,
  ReadingScheduleItem,
  ScheduleInfo,
} from '../data/Database/types';
import {setUpdatePages} from '../data/Store/actions';
import {translate} from './localization/localization';

export const WEEKLY_READING_TABLE_NAME = 'tblWeeklyReading';

export enum Frequency {
  Daily = 0,
  Weekly = 1,
  Monthly = 2,
  Never = 3,
}

export const FREQS = {
  DAILY: Frequency.Daily,
  WEEKLY: Frequency.Weekly,
  MONTHLY: Frequency.Monthly,
  NEVER: Frequency.Never,
};

export enum VersePosition {
  Start = 0,
  Middle = 1,
  End = 2,
  StartAndEnd = 3,
}

export const VERSE_POSITION = {
  START: VersePosition.Start,
  MIDDLE: VersePosition.Middle,
  END: VersePosition.End,
  START_AND_END: VersePosition.StartAndEnd,
};

export enum ScheduleType {
  Sequential = 0,
  Chronological = 1,
  Thematic = 2,
  Custom = 3,
}

export const SCHEDULE_TYPES = {
  SEQUENTIAL: ScheduleType.Sequential,
  CHRONOLOGICAL: ScheduleType.Chronological,
  THEMATIC: ScheduleType.Thematic,
  CUSTOM: ScheduleType.Custom,
};

export enum Error {
  NameTaken,
}

export const ERROR = {NAME_TAKEN: Error.NameTaken};

export function openJWLibrary() {
  const appLink =
    Platform.OS === 'ios' ? 'jwpub://' : 'http://jwlibrary.jw.org';
  Linking.openURL(appLink);
}

export function arraysMatch(arr1: any[], arr2: any[]) {
  // Check if the arrays are the same length
  if (arr1.length !== arr2.length) {
    return false;
  }

  // Check if all items exist and are in the same order
  for (var i = 0; i < arr1.length; i++) {
    if (typeof arr1[i] === 'object' || typeof arr2[i] === 'object') {
      console.log('Item at index', i, 'of array comparison is an object');
    }
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }

  // Otherwise, return true
  return true;
}

export function sanitizeNumber(
  prevValue: string,
  newValue: string,
  lowerLimit: number,
  upperLimit: number,
) {
  let result = '';

  newValue = newValue || '';
  prevValue = prevValue || '';

  let change = newValue.length - prevValue.length;

  if (change < 1) {
    result = newValue;
  } else {
    if (newValue[newValue.length - 1] === '.') {
      result = newValue;
    } else {
      let number = parseFloat(newValue);
      if (!isNaN(number) && number >= lowerLimit && number <= upperLimit) {
        result = number.toString();
      } else {
        result = prevValue;
      }
    }
  }

  return result;
}

export function getWeeksBetween(date1: string, date2: string) {
  let d1 = Date.parse(date1);
  let d2 = Date.parse(date2);
  let millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;
  let msDifference = d2 - d1;
  let weeksBetween = Math.round(msDifference / millisecondsPerWeek);
  return weeksBetween;
}

export function useUpdate(
  updatePages: number,
  dispatch: (event: object) => {},
) {
  return useCallback(() => {
    dispatch(setUpdatePages(updatePages));
  }, [updatePages, dispatch]);
}

export function createPickerArray(...labels: any[]) {
  const pickerValues = [];
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    pickerValues.push({value: i, label: label});
  }
  return pickerValues;
}

export function getWeekdays() {
  const fromToday = (resetDayOfWeek: number, direction: -1 | 1) => {
    let date = new Date();
    let adj = (resetDayOfWeek - date.getDay()) * direction;
    return (7 + adj) % 7;
  };
  return {
    beforeToday: (reset: number) => {
      return fromToday(reset, -1);
    },
    afterToday: (reset: number) => {
      return fromToday(reset, 1);
    },
  };
}

export function createDailyTextLink() {
  const locale = translate('links.finderLocale');
  const today = new Date();
  const month = today.getMonth();
  let par = today.getDate() * 3;
  const pars = `${par - 1}-${par + 1}`;

  let href = `https://www.jw.org/finder?srcid=BibleStudyCompanion&wtlocale=${locale}&prefer=lang&docid=11020214${month}&par=${pars}`;
  return href;
}

export function versionIsLessThan(version: string, checkVersion: string) {
  let values = version.split('.');
  let checkValues = checkVersion.split('.');

  for (let i = 0; i < checkValues.length; i++) {
    if (i > values.length - 1) return false;

    let checkNumber = parseInt(checkValues[i], 10);
    let curNumber = parseInt(values[i], 10);

    if (curNumber < checkNumber) return true;

    if (i < checkValues.length - 1 && curNumber > checkNumber) return false;
  }

  //If we've gotten here it should be because they are equal
  return false;
}

// !!! ----------------------------------------- D.O.A. Depricated On Arival -----------------------------------------
export async function legacyBugFixFor103(
  userDB: Database,
  bibleDB: Database,
  prevVersion: string,
) {
  if (!versionIsLessThan(prevVersion, '1.0.3')) return;

  const tblSchedules = await runSQL(userDB, 'SELECT * FROM tblSchedules;');

  for (let i = 0; i < tblSchedules.rows.length; i++) {
    const tableInfo: ScheduleInfo = tblSchedules.rows.item(i);
    const tableName = formatScheduleTableName(tableInfo.ID);
    let firstItem = await runSQL(
      userDB,
      `SELECT CompletionDate FROM ${tableName} WHERE ReadingDayID=1;`,
    );
    let itemInfo: ReadingScheduleItem = firstItem.rows.item(i);
    let compDate = new Date(itemInfo.CompletionDate);
    let compDateIsADate = !isNaN(compDate.getTime());

    if (!compDateIsADate) {
      compDate = new Date();
    }

    await recreateSchedule(userDB, bibleDB, tableInfo.ScheduleName, {
      startDate: compDate,
    });
  }
}
