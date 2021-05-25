import React, {useState} from 'react';
import {Appearance, Platform, View, ViewStyle} from 'react-native';
import RNDateTimePicker, {Event} from '@react-native-community/datetimepicker';
import TextButton from '../buttons/TextButton';

import {translate} from '../../logic/localization/localization';
import styles, {colors} from '../../styles/styles';

const useDateTimePicker = (props: {
  hideTimePicker: Function;
  onChange: Function;
  testID: string;
  time: Date;
}) => {
  const {hideTimePicker, onChange, time} = props;

  const [tempTime, setTempTime] = useState(time);

  const onEditCancel = () => {
    hideTimePicker();
    setTempTime(time);
  };

  const onEditDone = () => {
    hideTimePicker();
    onChange(tempTime);
  };

  const onPickerChange = (e: Event, newTime: Date | undefined) => {
    const isAndroid = Platform.OS === 'android';

    if (isAndroid) {
      hideTimePicker();
      if (e.type === 'dismissed') {
        onEditCancel();
        return;
      }
    }

    if (!newTime) return;

    setTempTime(newTime);

    onChange(newTime);
  };
  return {onEditCancel, onEditDone, onPickerChange, tempTime};
};

const ActionButtons = (props: {
  onEditCancel: () => void;
  onEditDone: () => void;
  testID: string;
}) => {
  const {onEditCancel, onEditDone, testID} = props;
  return (
    <View style={styles.row}>
      <TextButton
        testID={testID + '.cancelButton'}
        onPress={onEditCancel}
        text={translate('actions.cancel')}
      />
      <TextButton
        testID={testID + '.doneButton'}
        onPress={onEditDone}
        text={translate('actions.done')}
      />
    </View>
  );
};

const DateTimePicker = (props: {
  hideTimePicker: Function;
  mode: 'time' | 'date' | undefined;
  onChange: Function;
  testID: string;
  time: Date;
}) => {
  const {mode, testID} = props;
  const {onEditCancel, onEditDone, onPickerChange, tempTime} =
    useDateTimePicker(props);

  let style: ViewStyle = {
    backgroundColor: colors.smoke,
    borderRadius: 10,
    overflow: 'hidden',
  };
  const colorScheme = Appearance.getColorScheme();

  if (Platform.OS === 'ios' && colorScheme === 'dark') {
    style.backgroundColor = colors.lightGray;
  }

  return (
    <View>
      <View style={style}>
        <RNDateTimePicker
          testID={testID}
          value={tempTime}
          mode={mode}
          onChange={onPickerChange}
        />
      </View>
      {Platform.OS === 'ios' && (
        <ActionButtons
          onEditCancel={onEditCancel}
          onEditDone={onEditDone}
          testID={testID}
        />
      )}
    </View>
  );
};

export default DateTimePicker;
