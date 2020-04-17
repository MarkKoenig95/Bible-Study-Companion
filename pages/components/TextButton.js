import React from 'react';
import {Text} from 'react-native';
import CustomButton from './CustomButton';

import styles from '../styles/styles';

export default function TextButton(props) {
  return (
    <CustomButton
      style={[props.buttonStyle, styles.button]}
      onPress={props.onPress}>
      <Text style={[styles.buttonText, props.textStyle]}>{props.text}</Text>
    </CustomButton>
  );
}
