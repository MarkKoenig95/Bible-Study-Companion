import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';

import styles, {colors} from '../../styles/styles';
import {Body} from '../text/Text';
import {Platform, TouchableOpacity} from 'react-native';

import moment from 'moment';
import {DateTimePicker} from '../inputs/DateTimePicker';
import TextButton from './TextButton';
import {translate} from '../../logic/localization/localization';
import {useEffect} from 'react';

export default function TimePickerButton(props) {
  const {time, onChange, invert, textPrefix} = props;
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);

  const backgroundColor = invert ? colors.lightBlue : colors.smoke + '40';
  const textStyle = props.textStyle;

  useEffect(() => {
    if (isTimePickerVisible && Platform.OS === 'android') {
      setIsTimePickerVisible(false);
    }
  }, [isTimePickerVisible]);

  return (
    <View
      style={{
        ...style.selectTimeButton,
        backgroundColor: backgroundColor,
      }}>
      {!isTimePickerVisible ? (
        <TouchableOpacity
          onPress={() => {
            setIsTimePickerVisible(!isTimePickerVisible);
          }}>
          <Body style={textStyle}>
            {(textPrefix || '') + moment(time).format('LT')}
          </Body>
        </TouchableOpacity>
      ) : (
        <TimePickerSection
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
    <View>
      <DateTimePicker value={tempTime} mode="time" onChange={onPickerChange} />
      <View style={style.buttonContainer}>
        <TextButton onPress={onEditCancel} text={translate('actions.cancel')} />
        <TextButton onPress={onEditDone} text={translate('actions.done')} />
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
