import React from 'react';
import {TouchableOpacity} from 'react-native';

import styles from '../../styles/styles';

export default function CustomButton(props) {
  return (
    <TouchableOpacity {...props} style={[styles.button, props.style]}>
      {props.children}
    </TouchableOpacity>
  );
}
