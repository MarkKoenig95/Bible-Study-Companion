import React from 'react';
import Text from '../text/Text';
import CustomButton from './CustomButton';

import styles from '../../styles/styles';

export default function TextButton(props) {
  const {buttonStyle, onPress, testID, text, textStyle} = props;
  return (
    <CustomButton
      testID={testID}
      style={[styles.button, buttonStyle]}
      onPress={onPress}>
      <Text style={[styles.buttonText, textStyle]}>{text}</Text>
    </CustomButton>
  );
}
