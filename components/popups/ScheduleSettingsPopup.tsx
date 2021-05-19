import React from 'react';

import Popup from './Popup';
import Text, {Body} from '../text/Text';

import {translate} from '../../logic/localization/localization';

import styles, {colors} from '../../styles/styles';
import CheckBox from '../buttons/CheckBox';
import {ToggleEditInput} from '../inputs/ToggleEditInput';
import {View} from 'react-native';

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
      <View style={styles.row}>
        <Body>{translate('schedulePage.hideCompleted')}</Body>
        <CheckBox
          testID={testID + '.hideCompletedCheckBox'}
          checked={completedHidden}
          uncheckedColor={styles.lightText.color}
          checkedColor={colors.darkBlue}
          onPress={onSetHideCompleted}
        />
      </View>
      <View style={styles.row}>
        <Body>{translate('createSchedulePopup.shouldTrack')}</Body>
        <CheckBox
          testID={testID + '.shouldTrackCheckBox'}
          checked={doesTrack}
          uncheckedColor={styles.lightText.color}
          checkedColor={colors.darkBlue}
          onPress={onSetDoesTrack}
        />
      </View>
      <View style={styles.row}>
        <ToggleEditInput
          testID={testID + '.scheduleNameInput'}
          onTextChange={onScheduleNameChange}
          text={scheduleName}
          title={translate('createSchedulePopup.scheduleName')}
        />
      </View>
      <Text>Change start date</Text>
      <Text>Add a way to update all items earlier than a chosen item</Text>
    </Popup>
  );
}
