import React, {useCallback, useState} from 'react';
import {Alert, Linking, Platform} from 'react-native';
import {StackActions, StackActionType} from '@react-navigation/native';
import {runSQL} from '../data/Database/generalTransactions';
import {
  formatScheduleTableName,
  recreateSchedule,
} from '../data/Database/scheduleTransactions';
import {
  Database,
  DBBibleReadingItem,
  DBQueryResult,
  DBReadingItem,
  ScheduleInfo,
} from '../data/Database/types';
import {incrementUpdatePages} from '../data/Store/actions';
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

export function sanitizeStringNumber(
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

export function useUpdate(dispatch: (event: object) => {}) {
  return useCallback(() => {
    dispatch(incrementUpdatePages());
  }, [dispatch]);
}

export function useToggleState(initialValue: boolean): [boolean, () => void] {
  const [value, setValue] = useState(initialValue);
  const toggleValue = useCallback(() => {
    setValue(!value);
  }, [value]);
  return [value, toggleValue];
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

//TODO - Implement this
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

export function pageBack(navigation: {
  dispatch: (action: StackActionType) => void;
}) {
  navigation.dispatch(StackActions.pop(1));
}

async function recreateAllUserSchedules(userDB: Database, bibleDB: Database) {
  const tblSchedules = await runSQL(userDB, 'SELECT * FROM tblSchedules;');

  if (!tblSchedules) {
    return;
  }

  for (let i = 0; i < tblSchedules.rows.length; i++) {
    const tableInfo: ScheduleInfo = tblSchedules.rows.item(i);
    const creationInfo = tableInfo.CreationInfo;
    const tableName = formatScheduleTableName(tableInfo.ScheduleID);

    if (
      (creationInfo as string) === WEEKLY_READING_TABLE_NAME ||
      !creationInfo
    ) {
      continue;
    }

    let firstItem = await runSQL(
      userDB,
      `SELECT CompletionDate FROM ${tableName} WHERE ID=1;`,
    );

    if (!firstItem) {
      continue;
    }

    let itemInfo: DBReadingItem | DBBibleReadingItem = firstItem.rows.item(0);
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

/** Given an array and an index will return a new array with the element at that index removed */
export function removeElementFromArrayAtIndex(array: any[], index: number) {
  let firstHalf = array.slice(0, index);
  let lastHalf = array.slice(index + 1, array.length);

  let newArray = [...firstHalf, ...lastHalf];
  return newArray;
}

// !!! ----------------------------------------- D.O.A. Depricated On Arival -----------------------------------------
export async function legacyBugFixForv1_1_0(
  userDB: Database,
  bibleDB: Database,
  prevVersion: string,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
) {
  if (!versionIsLessThan(prevVersion, '1.1.0')) return;

  setIsLoading(true);

  await recreateAllUserSchedules(userDB, bibleDB);

  setIsLoading(false);

  Alert.alert(
    translate('prompts.scheduleRecreatedTitle'),
    translate('prompts.scheduleRecreatedMessage'),
  );
}

export async function legacyBugFixForv1_3_3(
  userDB: Database,
  prevVersion: string,
) {
  if (!versionIsLessThan(prevVersion, '1.3.3')) return;

  let tableName = '';

  //Get the user's list of reading schedules
  let schedules = (await runSQL(
    userDB,
    'SELECT * FROM tblSchedules',
  )) as DBQueryResult;

  //Loop through the list and select the first reading portion that is not completed
  for (let i = 0; i < schedules.rows.length; i++) {
    const schedule = schedules.rows.item(i);
    const id = schedule.ScheduleID;
    const creationInfo = schedule.CreationInfo;
    let tableName;

    if (creationInfo.slice(0, 3) === 'tbl') {
      if (creationInfo === WEEKLY_READING_TABLE_NAME) {
        continue;
      }
      tableName = creationInfo;
    } else {
      tableName = formatScheduleTableName(id);
    }

    let testItem = (await runSQL(
      userDB,
      `SELECT * FROM ${tableName} LIMIT 1`,
    )) as DBQueryResult;

    if (testItem.rows.item(0).CreatedTime) continue;

    await runSQL(
      userDB,
      `ALTER TABLE ${tableName}
            RENAME COLUMN ReadingDayID to ID;`,
    );

    await runSQL(
      userDB,
      `ALTER TABLE ${tableName}
            ADD COLUMN CreatedTime 
            DATETIME NOT NULL DEFAULT 
            "2023-01-01 00:00:00";`,
    );

    await runSQL(
      userDB,
      `ALTER TABLE ${tableName}
            ADD COLUMN UpdatedTime 
            DATETIME NOT NULL DEFAULT 
            "2023-01-01 00:00:00";`,
    );
  }
}
