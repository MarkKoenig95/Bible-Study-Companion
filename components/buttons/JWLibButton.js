import React from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';

import Text from '../text/Text';

import styles, {colors} from '../../styles/styles';
import {openJWLibrary} from '../../logic/general';

export default function JWLibButton({testID}) {
  return (
    <TouchableOpacity
      testID={testID}
      style={[style.container, styles.navHeaderButton]}
      onPress={openJWLibrary}>
      <Text dark>JW</Text>
    </TouchableOpacity>
  );
}

const style = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.smoke,
    justifyContent: 'center',
  },
});
