import React from 'react';
import {Text} from 'react-native';
import CustomButton from './CustomButton';

import {colors} from '../styles/styles';

export default function TextButton(props) {
  return (
    <CustomButton style={props.buttonStyle} onPress={props.onPress}>
      <Text style={[{color: colors.darkGray}, props.textStyle]}>
        {props.text}
      </Text>
    </CustomButton>
  );
}
