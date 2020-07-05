import React, {useState, useEffect} from 'react';
import {Keyboard} from 'react-native';
import {translate} from '../../localization/localization';

import IconButton from '../buttons/IconButton';
import CustomInput from '../CustomInput';
import VersePicker from '../VersePicker';
import Popup from './Popup';

const debug = false;

const prefix = 'createSchedulePopup.';

export default function CreateSchedulePopup(props) {
  useEffect(() => {
    Keyboard.addListener('keyboardWillShow', _keyboardWillShow);
    Keyboard.addListener('keyboardWillHide', _keyboardWillHide);

    return () => {
      Keyboard.removeListener('keyboardWillShow', _keyboardWillShow);
      Keyboard.removeListener('keyboardWillHide', _keyboardWillHide);
    };
  }, []);

  const _keyboardWillShow = () => {
    setMarginTop(10);
  };

  const _keyboardWillHide = () => {
    setMarginTop(100);
  };

  //State and defaults for schedule info inputs
  const defaults = {
    scheduleName: '',
    scheduleDuration: '',
    chapter: '1',
    verse: '1',
    selectedItems: [],
  };

  const [scheduleName, setScheduleName] = useState(defaults.scheduleName);
  const [scheduleDuration, setScheduleDuration] = useState(
    defaults.scheduleDuration,
  );

  const [versePicker, setVersePicker] = useState({
    chapter: defaults.chapter,
    verse: defaults.verse,
    selectedItems: defaults.selectedItems,
  });

  const [marginTop, setMarginTop] = useState(null);

  function sanitizeNumber(prevValue, newValue, lowerLimit, upperLimit) {
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

  function sanitizeLetter(prevValue, newValue) {
    let result = '';
    newValue = newValue || '';
    prevValue = prevValue || '';

    let change = newValue.length - prevValue.length;

    if (change < 1) {
      result = newValue;
    } else {
      let newChar = newValue.slice(newValue.length - 1);

      if (
        (newChar >= 'a' && newChar <= 'z') ||
        (newChar >= 'A' && newChar <= 'Z') ||
        newChar === ' '
      ) {
        result = newValue;
      } else {
        result = prevValue;
      }
    }

    return result;
  }

  function onVersePickerChange(key, value) {
    if (key !== 'selectedItems') {
      value = sanitizeNumber(versePicker[key], value, 1, 200);
    }

    setVersePicker(prevVals => {
      return {...prevVals, [key]: value};
    });
  }

  function onScheduleNameChange(text) {
    let sanitizedState = sanitizeLetter(scheduleName, text);
    setScheduleName(text);
  }

  function onScheduleDurationChange(text) {
    let sanitizedState = sanitizeNumber(scheduleDuration, text, 0, 20);
    setScheduleDuration(sanitizedState);
  }

  function onAddPress() {
    //TODO: Check input values to validate
    if (
      versePicker.selectedItems &&
      scheduleName &&
      scheduleDuration &&
      versePicker.chapter &&
      versePicker.verse
    ) {
      let bookId = versePicker.selectedItems[0].id;

      props.onAdd(
        scheduleName,
        scheduleDuration,
        bookId,
        versePicker.chapter,
        versePicker.verse,
      );
      if (!debug) {
        setScheduleName(defaults.scheduleName);
        setScheduleDuration(defaults.scheduleDuration);
        setVersePicker({
          chapter: defaults.chapter,
          verse: defaults.verse,
          selectedItems: versePicker.selectedItems,
        });
      }
    } else {
      props.onError(translate(prefix + 'unfinished'));
    }
  }

  return (
    <Popup
      flatView
      style={marginTop && {marginTop: marginTop}}
      displayPopup={props.displayPopup}
      title={translate(prefix + 'createSchedule')}
      onClosePress={props.onClosePress}>
      <CustomInput
        title={translate(prefix + 'scheduleName')}
        onChangeText={text => onScheduleNameChange(text)}
        value={scheduleName}
        placeholder={translate(prefix + 'scheduleName')}
      />
      <CustomInput
        title={translate(prefix + 'scheduleDuration')}
        onChangeText={text => onScheduleDurationChange(text)}
        value={scheduleDuration}
        placeholder={translate(prefix + 'scheduleDurPhld')}
        keyboardType={'decimal-pad'}
      />
      <VersePicker
        title={translate(prefix + 'startingVerse')}
        onChange={onVersePickerChange}
        selectedItems={versePicker.selectedItems}
        chapterValue={versePicker.chapter}
        verseValue={versePicker.verse}
      />
      <IconButton name="add" onPress={onAddPress} />
    </Popup>
  );
}
