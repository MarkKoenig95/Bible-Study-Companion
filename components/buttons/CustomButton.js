import React from 'react';
import {TouchableOpacity} from 'react-native';

import styles from '../../styles/styles';

export default function CustomButton(props) {
  const {children, style} = props;
  return (
    <TouchableOpacity {...props} style={[styles.button, style]}>
      {children}
    </TouchableOpacity>
  );
}
