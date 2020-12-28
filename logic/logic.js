import React, {useCallback} from 'react';
import {Linking, Platform} from 'react-native';
import {setUpdatePages} from '../data/Store/actions';
import {translate} from './localization/localization';

export const ERROR = {NAME_TAKEN: 'NAME_TAKEN'};

export function openJWLibrary() {
  const appLink =
    Platform.OS === 'ios' ? 'jwpub://' : 'http://jwlibrary.jw.org';
  Linking.openURL(appLink);
}

export function arraysMatch(arr1, arr2) {
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

export function sanitizeNumber(prevValue, newValue, lowerLimit, upperLimit) {
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
      let number = parseFloat(newValue, 10);
      if (!isNaN(number) && (number >= lowerLimit && number <= upperLimit)) {
        result = number.toString();
      } else {
        result = prevValue;
      }
    }
  }

  return result;
}

export function getWeeksBetween(date1, date2) {
  let d1 = Date.parse(date1);
  let d2 = Date.parse(date2);
  let millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;
  let msDifference = d2 - d1;
  let weeksBetween = Math.round(msDifference / millisecondsPerWeek);
  return weeksBetween;
}

export function useUpdate(updatePages, dispatch) {
  return useCallback(() => {
    dispatch(setUpdatePages(updatePages));
  }, [updatePages, dispatch]);
}

export function createPickerArray(...labels) {
  const pickerValues = [];
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    pickerValues.push({value: i, label: label});
  }
  return pickerValues;
}

export function getWeekdaysFromToday(resetDayOfWeek) {
  let date = new Date();
  const getWeekdaysBase = beforeOrAfter => {
    let adjDayIndex = date.getDay() - resetDayOfWeek;
    let newDayIndex = beforeOrAfter * adjDayIndex;
    return (7 + newDayIndex) % 7;
  };

  return {before: getWeekdaysBase(-1), after: getWeekdaysBase(1)};
}

export function getWeekdaysAfterToday(resetDayOfWeek) {
  let date = new Date();
  return (7 + (date.getDay() - resetDayOfWeek)) % 7;
}

export function getWeekdaysBeforeToday(resetDayOfWeek) {
  let date = new Date();
  return (7 - (date.getDay() - resetDayOfWeek)) % 7;
}
