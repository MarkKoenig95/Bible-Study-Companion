import React from 'react';
import {TouchableOpacity} from 'react-native';

import styles from '../../styles/styles';

export default function CustomButton(props) {
  return (
    <TouchableOpacity
      style={[styles.button, props.style]}
      onPress={props.onPress}>
      {props.children}
    </TouchableOpacity>
  );
}
