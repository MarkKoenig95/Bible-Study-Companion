import React from 'react';

import Popup from '../Popup';
import Text from '../../text/Text';

import {translate} from '../../../logic/localization/localization';

import styles, {colors} from '../../../styles/styles';
import CheckBox from '../../buttons/CheckBox';
import {ScheduleNameInput} from './components';

interface SettingsPopupProps {
  completedHidden: boolean;
  displayPopup: boolean;
  doesTrack: boolean;
  onClosePress: Function;
  onScheduleNameChange: (name: string) => void;
  onSetDoesTrack: Function;
  onSetHideCompleted: Function;
  scheduleName: string;
  testID: string;
  title: string;
}

export default function ScheduleSettingsPopup(props: SettingsPopupProps) {
  const {
    completedHidden,
    displayPopup,
    doesTrack,
    onClosePress,
    onScheduleNameChange,
    onSetDoesTrack,
    onSetHideCompleted,
    scheduleName,
    testID,
    title,
  } = props;

  return (
    <Popup
      testID={testID}
      displayPopup={displayPopup}
      title={title}
      onClosePress={onClosePress}>
      <CheckBox
        testID={testID + '.hideCompletedCheckBox'}
        title={translate('schedulePage.hideCompleted')}
        checked={completedHidden}
        uncheckedColor={styles.lightText.color}
        checkedColor={colors.darkBlue}
        onPress={onSetHideCompleted}
      />
      <CheckBox
        testID={testID + '.shouldTrackCheckBox'}
        title={translate('createSchedulePopup.shouldTrack')}
        checked={doesTrack}
        uncheckedColor={styles.lightText.color}
        checkedColor={colors.darkBlue}
        onPress={onSetDoesTrack}
      />
      <ScheduleNameInput
        onScheduleNameChange={onScheduleNameChange}
        scheduleName={scheduleName}
        testID={testID + '.scheduleNameInput'}
      />
      <Text>Change start date</Text>
      <Text>Add a way to update all items earlier than a chosen item</Text>
    </Popup>
  );
}
