import React from 'react';
import {ActivityIndicator, Modal, View} from 'react-native';

import styles, {colors} from '../../styles/styles';

export default function LoadingPopup(props) {
  return (
    <View
      style={[
        styles.background,
        {
          display: !props.displayPopup ? 'none' : 'flex',
          justifyContent: 'center',
        },
      ]}>
      <ActivityIndicator size="large" color={colors.darkGray} />
    </View>
  );
}
