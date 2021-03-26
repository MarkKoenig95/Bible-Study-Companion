import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';

import styles, {colors} from '../../styles/styles';
import {Body} from '../text/Text';
import {Platform, TouchableOpacity} from 'react-native';

import moment from 'moment';
import DateTimePicker from '../inputs/DateTimePicker';
import TextButton from './TextButton';
import {translate} from '../../logic/localization/localization';
import {useEffect} from 'react';

export default function TimePickerButton(props) {
  const {time, onChange, invert, testID, textPrefix, textStyle} = props;

  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);

  const backgroundColor = invert ? colors.lightBlue : colors.smoke + '40';

  useEffect(() => {
    if (isTimePickerVisible && Platform.OS === 'android') {
      setIsTimePickerVisible(false);
    }
  }, [isTimePickerVisible]);

  return (
    <View
      testID={testID}
      style={{
        ...style.selectTimeButton,
        backgroundColor: backgroundColor,
      }}>
      {!isTimePickerVisible ? (
        <TouchableOpacity
          testID={testID + '.showPickerButton'}
          onPress={() => {
            setIsTimePickerVisible(!isTimePickerVisible);
          }}>
          <Body style={textStyle}>
            {(textPrefix || '') + moment(time).format('LT')}
          </Body>
        </TouchableOpacity>
      ) : (
        <TimePickerSection
          testID={testID + 'timePickerSection'}
          hideTimePicker={() => {
            setIsTimePickerVisible(false);
          }}
          onChange={onChange}
          time={time}
        />
      )}
    </View>
  );
}

const TimePickerSection = props => {
  const {hideTimePicker, onChange, testID, time} = props;

  const [tempTime, setTempTime] = useState(time);

  const onEditCancel = () => {
    hideTimePicker();
    setTempTime(time);
  };

  const onEditDone = () => {
    hideTimePicker();
    onChange(tempTime);
  };

  const onPickerChange = (e, newTime) => {
    if (newTime) {
      setTempTime(newTime);

      if (Platform.OS === 'android') {
        if (e.type === 'set') {
          onChange(newTime);
        } else if (e.type === 'dismissed') {
          onEditCancel();
        } else {
          onChange(newTime);
        }
      }
    }
  };

  return (
    <View testID={testID}>
      <DateTimePicker
        testID={testID + '.picker'}
        value={tempTime}
        mode="time"
        onChange={onPickerChange}
      />
      <View style={style.buttonContainer}>
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
    </View>
  );
};

const style = StyleSheet.create({
  selectTimeButton: {
    borderRadius: 10,
    flex: 1,
    margin: 10,
    minWidth: 150,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
});
