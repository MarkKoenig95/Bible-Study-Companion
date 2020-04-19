import React, {useState} from 'react';

import IconButton from './IconButton';
import CustomInput from './CustomInput';
import VersePicker from './VersePicker';
import Popup from './Popup';

export default function CreateSchedulePopup(props) {
  //State and defaults for shceudle info inputs
  const defaults = {
    scheduleName: 'Schedule Name',
    scheduleDuration: 'In years',
  };

  const [scheduleName, setScheduleName] = useState(defaults.scheduleName);
  const [scheduleDuration, setScheduleDuration] = useState(
    defaults.scheduleDuration,
  );

  //TODO: Sanitize input fields and throw error if values are still defaults

  const [versePicker, setVersePicker] = useState({
    chapter: defaults.chapter,
    verse: defaults.verse,
    selectedItems: [],
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
        placeholder={defaults.scheduleName}
      />
      <CustomInput
        title="Schedule Duration"
        onChange={text => setScheduleDuration(text)}
        value={scheduleDuration}
        placeholder={defaults.scheduleDuration}
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
