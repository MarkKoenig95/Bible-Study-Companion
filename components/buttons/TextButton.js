import React from 'react';
import Text from '../text/Text';
import CustomButton from './CustomButton';

import styles from '../../styles/styles';

export default function TextButton(props) {
  return (
    <CustomButton
      style={[styles.button, props.buttonStyle]}
      onPress={props.onPress}>
      <Text style={[styles.buttonText, props.textStyle]}>{props.text}</Text>
    </CustomButton>
  );
}
