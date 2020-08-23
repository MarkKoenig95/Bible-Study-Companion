import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';

import {colors} from '../../styles/styles';
import {Body} from '../text/Text';
import {TouchableOpacity} from 'react-native';

import moment from 'moment';
import {DateTimePicker} from '../inputs/DateTimePicker';

export default function TimePickerButton(props) {
  const {time, onChange, invert, textPrefix} = props;
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);

  const backgroundColor = invert ? colors.lightBlue : colors.smoke + '40';
  const textStyle = props.textStyle;

  return (
    <View
      style={{
        flex: 1,
      }}>
      <TouchableOpacity
        style={{...style.selectTimeButton, backgroundColor: backgroundColor}}
        onPress={() => {
          setIsTimePickerVisible(!isTimePickerVisible);
        }}>
        <Body style={textStyle}>
          {(textPrefix || '') + moment(time).format('LT')}
        </Body>
        {isTimePickerVisible && (
          <DateTimePicker
            value={time}
            mode="time"
            display="spinner"
            onChange={(e, newTime) => {
              setIsTimePickerVisible(false);
              if (newTime) {
                onChange(newTime);
              }
            }}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

const style = StyleSheet.create({
  selectTimeButton: {
    borderRadius: 10,
    margin: 10,
    minWidth: 150,
  },
});
