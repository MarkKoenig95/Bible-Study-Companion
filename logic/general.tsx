import React, {useCallback} from 'react';
import {Linking, Platform} from 'react-native';
import {Database, runSQL} from '../data/Database/generalTransactions';
import {recreateSchedule} from '../data/Database/scheduleTransactions';
import {setUpdatePages} from '../data/Store/actions';
import {translate} from './localization/localization';
import {DBQueryResult} from './scheduleCreation';

export const WEEKLY_READING_TABLE_NAME = 'tblWeeklyReading';

/** @typedef {number} integer */

/**
 * @typedef {number} Frequency
 * @enum
 * @property {integer} [DAILY=0]
 * @property {integer} [WEEKLY=1]
 * @property {integer} [MONTHLY=2]
 * @property {integer} [NEVER=3]
 */

/** @type {Frequency} */
export const FREQS = {
  DAILY: 0,
  WEEKLY: 1,
  MONTHLY: 2,
  NEVER: 3,
};

/**
 * @typedef  {number} VersePosition
 * @enum
 * @property {integer} [START=0] Indicates that the verse (or span of verses) includes the starting verse of the chapter
 * @property {integer} [MIDDLE=1] Indicates that the verse (or span of verses) does not include the starting or ending verse of the chapter
 * @property {integer} [END=2] Indicates that the verse (or span of verses) includes the ending verse of the chapter
 * @property {integer} [START_AND_END=3] Indicates that the verse (or span of verses) includes both the starting and ending verse of the chapter
 */
export const VERSE_POSITION = {START: 0, MIDDLE: 1, END: 2, START_AND_END: 3};

/**
 * @typedef {number} ScheduleType
 * @enum
 * @property {integer} [SEQUENTIAL=0]
 * @property {integer} [CHRONOLOGICAL=1]
 * @property {integer} [THEMATIC=2]
 * @property {integer} [CUSTOM=3]
 */
export const SCHEDULE_TYPES = {
  SEQUENTIAL: 0,
  CHRONOLOGICAL: 1,
  THEMATIC: 2,
  CUSTOM: 3,
};

/**
 * @typedef {object} Error
 * @property {string} Error.NAME_TAKEN
 * @enum
 */

/** @type {Error} */
export const ERROR = {NAME_TAKEN: 'NAME_TAKEN'};

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

export async function legacyBugFixFor103(
  userDB: Database,
  bibleDB: Database,
  prevVersion: string,
) {
  if (!versionIsLessThan(prevVersion, '1.0.3')) return;

  //Recreate the schedules that have been created to fix the bug with schedule creation from earlier
  let schedules: DBQueryResult = await runSQL(
    userDB,
    'SELECT * FROM tblSchedules WHERE ScheduleType=? OR ScheduleType=?',
    [SCHEDULE_TYPES.CHRONOLOGICAL, SCHEDULE_TYPES.THEMATIC],
  );

  let promises = [];

  for (let i = 0; i < schedules.rows.length; i++) {
    const schedule = schedules.rows.item(i);
    promises.push(recreateSchedule(userDB, bibleDB, schedule.ScheduleName));
  }

  await Promise.all(promises);
}
