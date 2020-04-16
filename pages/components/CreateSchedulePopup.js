import React, {useState} from 'react';

import IconButton from './IconButton';
import CustomInput from './CustomInput';
// import VersePicker from './VersePicker';
import Popup from './Popup';
import {ShadowPropTypesIOS} from 'react-native';

export default function CreateSchedulePopup(props) {
  //State and defaults for shceudle info inputs
  const defaults = {
    scheduleName: 'Schedule Name',
    scheduleDuration: 'In years',
    book: 'Genesis',
    chapter: '1',
    verse: '1',
  };

  const [scheduleName, setScheduleName] = useState(defaults.scheduleName);
  const [scheduleDuration, setScheduleDuration] = useState(
    defaults.scheduleDuration,
  );

  const [versePicker, setVersePicker] = useState({
    book: defaults.book,
    chapter: defaults.chapter,
    verse: defaults.verse,
  });

  function onVersePickerChange(key, value) {
    setVersePicker(prevVals => {
      return {...prevVals, [key]: value};
    });
  }

  function onAddPress() {
    props.onAdd(scheduleName, scheduleDuration);
    setScheduleName(defaults.scheduleName);
    setScheduleDuration(defaults.scheduleDuration);
  }

  return (
    <Popup
      displayPopup={props.displayPopup}
      title="Create Schedule"
      onClosePress={props.onClosePress}>
      <CustomInput
        title="Schedule Name"
        onChange={text => setScheduleName(text)}
        value={scheduleName}
        defaultValue={defaults.scheduleName}
      />
      <CustomInput
        title="Schedule Duration"
        onChange={text => setScheduleDuration(text)}
        value={scheduleDuration}
        defaultValue={defaults.scheduleDuration}
      />
      {/* <VersePicker
        title="Starting Verse"
        onChange={onVersePickerChange}
        bookValue={versePicker.book}
        defaultBookValue={defaults.book}
        chapterValue={versePicker.chapter}
        defaultChapterValue={defaults.chapter}
        verseValue={versePicker.verse}
        defaultVerseValue={defaults.verse}
      /> */}
      <IconButton icon="+" onPress={onAddPress} />
    </Popup>
  );
}
