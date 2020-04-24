import React, {useState, useEffect} from 'react';
import {Keyboard} from 'react-native';

import IconButton from './IconButton';
import CustomInput from './CustomInput';
import VersePicker from './VersePicker';
import Popup from './Popup';

export default function CreateSchedulePopup(props) {
  useEffect(() => {
    Keyboard.addListener('keyboardWillShow', _keyboardWillShow);
    Keyboard.addListener('keyboardWillHide', _keyboardWillHide);

    // cleanup function
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

  //State and defaults for shceudle info inputs
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
      let number = parseInt(newValue, 10);
      if (!isNaN(number) && (number > lowerLimit && number < upperLimit)) {
        result = number.toString();
      } else {
        result = prevValue;
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
        (newChar >= 'A' && newChar <= 'Z')
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
      value = sanitizeNumber(versePicker[key], value, 0, 201);
    }

    setVersePicker(prevVals => {
      return {...prevVals, [key]: value};
    });
  }

  function onScheduleNameChange(text) {
    let sanitizedState = sanitizeLetter(scheduleName, text);
    setScheduleName(sanitizedState);
  }

  function onScheduleDurationChange(text) {
    let sanitizedState = sanitizeNumber(scheduleDuration, text, 0, 21);
    setScheduleDuration(sanitizedState);
  }

  function onAddPress() {
    //TODO: Check input values to validate
    if (
      versePicker.selectedItems[0].id &&
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
      // setScheduleName(defaults.scheduleName);
      // setScheduleDuration(defaults.scheduleDuration);
      // setVersePicker({
      //   chapter: defaults.chapter,
      //   verse: defaults.verse,
      //   selectedItems: versePicker.selectedItems,
      // });
    } else {
      props.onError(
        'Please fill in all of the required fields to make a schedule',
      );
    }
  }

  return (
    <Popup
      style={marginTop && {marginTop: marginTop}}
      displayPopup={props.displayPopup}
      title="Create Schedule"
      onClosePress={props.onClosePress}>
      <CustomInput
        title="Schedule Name"
        onChangeText={text => onScheduleNameChange(text)}
        value={scheduleName}
        placeholder="Schedule Name"
      />
      <CustomInput
        title="Schedule Duration"
        onChangeText={text => onScheduleDurationChange(text)}
        value={scheduleDuration}
        placeholder="In Years"
      />
      <VersePicker
        title="Starting Verse"
        onChange={onVersePickerChange}
        selectedItems={versePicker.selectedItems}
        chapterValue={versePicker.chapter}
        verseValue={versePicker.verse}
      />
      <IconButton name="add" onPress={onAddPress} />
    </Popup>
  );
}
