import React from 'react';

import IconButton from '../../buttons/IconButton';
import CustomInput from '../../inputs/CustomInput';
import Popup from '../Popup';
import {
  AdvancedSettingsSection,
  CustomInputs,
  ScheduleInputs,
} from './components';

import {translate} from '../../../logic/localization/localization';
import {useCreateSchedulePopup} from './logic';
import {CreateSchedulePopupProps} from './types';

const prefix = 'createSchedulePopup.';

export default function CreateSchedulePopup(props: CreateSchedulePopupProps) {
  const {displayPopup, onClosePress, testID} = props;
  const {
    doesTrack,
    isCustom,
    maxPortion,
    onAddPress,
    onScheduleDurationChange,
    onVersePickerChange,
    portionsPerDay,
    readingPortionDesc,
    readingPortionSelectedItems,
    scheduleDuration,
    scheduleName,
    setDoesTrack,
    setMaxPortion,
    setPortionsPerDay,
    setReadingPortionDesc,
    setReadingPortionSelectedItems,
    setScheduleName,
    setStartDate,
    setStartingPortion,
    startDate,
    startingPortion,
    versePicker,
  } = useCreateSchedulePopup(props);

  return (
    <Popup
      testID={testID}
      displayPopup={displayPopup}
      title={translate(prefix + 'createSchedule')}
      onClosePress={onClosePress}>
      <CustomInput
        testID={testID + '.scheduleNameInput'}
        title={translate(prefix + 'scheduleName')}
        onChangeText={setScheduleName}
        value={scheduleName}
        placeholder={translate(prefix + 'scheduleName')}
      />
      {isCustom ? (
        <CustomInputs
          testID={testID}
          maxPortion={maxPortion}
          portionsPerDay={portionsPerDay}
          readingPortionDesc={readingPortionDesc}
          readingPortionSelectedItems={readingPortionSelectedItems}
          setMaxPortion={setMaxPortion}
          setPortionsPerDay={setPortionsPerDay}
          setReadingPortionDesc={setReadingPortionDesc}
          setReadingPortionSelectedItems={setReadingPortionSelectedItems}
          setStartingPortion={setStartingPortion}
          startingPortion={startingPortion}
        />
      ) : (
        <ScheduleInputs
          testID={testID}
          onScheduleDurationChange={onScheduleDurationChange}
          scheduleDuration={scheduleDuration}
          onVersePickerChange={onVersePickerChange}
          selectedItems={versePicker.selectedItems}
          chapterValue={versePicker.chapter}
          verseValue={versePicker.verse}
        />
      )}

      <AdvancedSettingsSection
        testID={testID}
        doesTrack={doesTrack}
        setDoesTrack={setDoesTrack}
        setStartDate={setStartDate}
        startDate={startDate}
      />

      <IconButton
        testID={testID + '.addButton'}
        name="add"
        onPress={onAddPress}
      />
    </Popup>
  );
}
