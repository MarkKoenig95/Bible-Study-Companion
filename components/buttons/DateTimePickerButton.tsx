import React, {useState, useEffect} from 'react';
import {
  Platform,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';
import {Body} from '../text/Text';
import DateTimePicker from '../inputs/DateTimePicker';

import {colors} from '../../styles/styles';
import moment from 'moment';
import {versionIsLessThan} from '../../logic/general';

const getDisplayText = (
  mode: 'time' | 'date',
  time: Date,
  textPrefix?: string,
) => {
  const modes = {
    time: (textPrefix || '') + moment(time).format('LT'),
    date: time.toLocaleDateString(),
  };

  return modes[mode];
};

export default function DateTimePickerButton(props: {
  invert?: boolean;
  mode: 'time' | 'date';
  onChange: Function;
  testID: string;
  textPrefix?: string;
  textStyle?: TextStyle;
  time: Date;
}) {
  const {invert, mode, onChange, testID, textPrefix, textStyle, time} = props;

  const backgroundColor = invert ? colors.lightBlue : colors.smoke + '40';

  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);

  const [displayText, setDisplayText] = useState('');

  let minWidthStyle = {};

  if (Platform.OS === 'ios' && versionIsLessThan(Platform.Version, '13')) {
    minWidthStyle = {minWidth: 200};
  }

  useEffect(() => {
    let tempDisplayText = getDisplayText(mode, time, textPrefix);
    setDisplayText(tempDisplayText);
  }, [mode, textPrefix, time]);

  return (
    <View
      testID={testID}
      style={{
        ...style.selectTimeButton,
        ...minWidthStyle,
        backgroundColor: backgroundColor,
      }}>
      {!isTimePickerVisible ? (
        <TouchableOpacity
          testID={testID + '.showButton'}
          onPress={() => {
            setIsTimePickerVisible(!isTimePickerVisible);
          }}>
          <Body testID={testID + '.display'} style={textStyle}>
            {displayText}
          </Body>
        </TouchableOpacity>
      ) : (
        <DateTimePicker
          testID={testID + '.picker'}
          hideTimePicker={() => {
            setIsTimePickerVisible(false);
          }}
          mode={mode}
          onChange={onChange}
          time={time}
        />
      )}
    </View>
  );
}

const style = StyleSheet.create({
  selectTimeButton: {
    borderRadius: 10,
    flex: 1,
    margin: 10,
  },
});
