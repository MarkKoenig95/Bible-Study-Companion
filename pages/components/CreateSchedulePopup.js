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
    chapter: 1,
    verse: 1,
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

  function onVersePickerChange(key, value) {
    setVersePicker(prevVals => {
      return {...prevVals, [key]: value};
    });
  }

  function onAddPress() {
    //TODO: Check input values to validate
    if (versePicker.selectedItems[0].id) {
      let bookId = versePicker.selectedItems[0].id;

      props.onAdd(
        scheduleName,
        scheduleDuration,
        bookId,
        versePicker.chapter,
        versePicker.verse,
      );
      setScheduleName(defaults.scheduleName);
      setScheduleDuration(defaults.scheduleDuration);
      setVersePicker({
        chapter: defaults.chapter,
        verse: defaults.verse,
        selectedItems: defaults.selectedItems,
      });
    }
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
