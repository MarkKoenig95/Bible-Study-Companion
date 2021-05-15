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
  onClosePress: Function;
  onHideCompleted: Function;
  onScheduleNameChange: (name: string) => void;
  scheduleName: string;
  testID: string;
  title: string;
}

export default function ScheduleSettingsPopup(props: SettingsPopupProps) {
  const {
    completedHidden,
    displayPopup,
    onClosePress,
    onHideCompleted,
    onScheduleNameChange,
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
        onPress={onHideCompleted}
      />
      <CheckBox
        testID={testID + '.shouldTrackCheckBox'}
        title={translate('createSchedulePopup.shouldTrack')}
        checked={completedHidden}
        uncheckedColor={styles.lightText.color}
        checkedColor={colors.darkBlue}
        onPress={onHideCompleted}
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
