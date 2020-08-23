import RNDateTimePicker from '@react-native-community/datetimepicker';
import React from 'react';
import {Platform, View} from 'react-native';
import {Appearance} from 'react-native';
import {colors} from '../../styles/styles';

export const DateTimePicker = React.memo(props => {
  let style = {borderRadius: 10, overflow: 'hidden'};
  const colorScheme = Appearance.getColorScheme();

  if (Platform.OS === 'ios') {
    if (colorScheme === 'dark') {
      style.backgroundColor = colors.lightGray;
    } else {
      style.backgroundColor = colors.smoke;
    }
  }
  return (
    <View style={style}>
      <RNDateTimePicker {...props} />
    </View>
  );
});
