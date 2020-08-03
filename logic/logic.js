import React, {useCallback} from 'react';
import {setUpdatePages} from '../data/Store/actions';

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

export function useUpdate(updatePages, dispatch) {
  return useCallback(() => {
    dispatch(setUpdatePages(updatePages));
  }, [updatePages, dispatch]);
}
