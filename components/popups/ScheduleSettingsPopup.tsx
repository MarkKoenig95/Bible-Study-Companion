import React from 'react';

import Popup from './Popup';
import {Body} from '../text/Text';

import {translate} from '../../logic/localization/localization';

import styles, {colors} from '../../styles/styles';
import CheckBox from '../buttons/CheckBox';
import {ToggleEditInput} from '../inputs/ToggleEditInput';
import {StyleSheet, View} from 'react-native';
import DateTimePickerButton from '../buttons/DateTimePickerButton';

interface SettingsPopupProps {
  completedHidden: boolean;
  displayPopup: boolean;
  doesTrack: boolean;
  onClosePress: Function;
  onScheduleNameChange: (name: string) => void;
  onSetDoesTrack: Function;
  onSetHideCompleted: Function;
  onStartDateChange: Function;
  scheduleName: string;
  startDate: Date;
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
    onStartDateChange,
    scheduleName,
    startDate,
    testID,
    title,
  } = props;

  return (
    <Popup
      testID={testID}
      displayPopup={displayPopup}
      title={title}
      onClosePress={onClosePress}>
      <View style={style.row}>
        <Body>{translate('schedulePage.hideCompleted')}</Body>
        <CheckBox
          testID={testID + '.hideCompletedCheckBox'}
          checked={completedHidden}
          uncheckedColor={styles.lightText.color}
          checkedColor={colors.darkBlue}
          onPress={onSetHideCompleted}
        />
      </View>
      <View style={style.row}>
        <Body>{translate('createSchedulePopup.shouldTrack')}</Body>
        <CheckBox
          testID={testID + '.shouldTrackCheckBox'}
          checked={doesTrack}
          uncheckedColor={styles.lightText.color}
          checkedColor={colors.darkBlue}
          onPress={onSetDoesTrack}
        />
      </View>
      <ToggleEditInput
        testID={testID + '.scheduleNameInput'}
        onTextChange={onScheduleNameChange}
        text={scheduleName}
        title={translate('createSchedulePopup.scheduleName')}
      />

      <View style={style.row}>
        <Body>{translate('createSchedulePopup.startDate')}</Body>
        <DateTimePickerButton
          testID={testID + '.datePicker'}
          mode={'date'}
          onChange={onStartDateChange}
          time={startDate}
        />
      </View>
    </Popup>
  );
}

const style = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomColor: colors.smoke,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 7,
    width: '100%',
  },
});
