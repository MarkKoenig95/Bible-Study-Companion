import React from 'react';
import {ActivityIndicator, Modal, View} from 'react-native';

import styles, {colors} from '../../styles/styles';

export default function LoadingPopup(props) {
  return (
    <Modal visible={props.displayPopup}>
      <View style={[styles.background, {justifyContent: 'center'}]}>
        <ActivityIndicator size="large" color={colors.darkGray} />
      </View>
    </Modal>
  );
}
