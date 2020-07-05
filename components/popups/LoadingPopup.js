import React, {useState} from 'react';
import {ActivityIndicator, View} from 'react-native';

import styles, {colors} from '../../styles/styles';
import {Header} from 'react-native/Libraries/NewAppScreen';

export default function Popup(props) {
  return (
    <View
      style={[
        styles.background,
        {display: !props.displayPopup ? 'none' : '', justifyContent: 'center'},
      ]}>
      <ActivityIndicator size="large" color={colors.darkGray} />
    </View>
  );
}

export function useLoadingPopup() {
  const [isLoading, setIsLoading] = useState(false);

  function setLoadingPopup(bool) {
    console.log(bool);

    setIsLoading(bool);
  }
  return {isLoading: isLoading, setLoadingPopup: setLoadingPopup};
}
