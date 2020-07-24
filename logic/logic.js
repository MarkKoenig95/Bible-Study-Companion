import React, {useCallback} from 'react';

export function useOpenPopupFunction(popupOpenFunction, closePopupFunctions) {
  const openPopup = useCallback((...args) => {
    //Close all popups
    closePopupFunctions.map(func => {
      func(false);
    });
    //Wait a little while
    setTimeout(() => {
      //Open the popup requested
      popupOpenFunction(...args);
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return openPopup;
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
  console.log('returning true');

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
