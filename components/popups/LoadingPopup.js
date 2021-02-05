import React from 'react';
import {ActivityIndicator, View} from 'react-native';

import styles, {colors} from '../../styles/styles';

export default function LoadingPopup(props) {
  const {displayPopup, testID} = props;
  return (
    <View
      testID={testID}
      style={[
        styles.background,
        {
          display: !displayPopup ? 'none' : 'flex',
          justifyContent: 'center',
        },
      ]}>
      <ActivityIndicator size="large" color={colors.darkGray} />
    </View>
  );
}
