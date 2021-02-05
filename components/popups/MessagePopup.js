import React, {useState, useCallback} from 'react';
import {StyleSheet, View} from 'react-native';

import Popup from './Popup';
import IconButton from '../buttons/IconButton';
import Text from '../text/Text';

import {translate} from '../../logic/localization/localization';

import styles from '../../styles/styles';

export default function MessagePopup(props) {
  const {displayPopup, message, onClosePress, onConfirm, testID, title} = props;
  const hasConfirmButton = onConfirm && true;

  return (
    <Popup
      testID={testID}
      displayPopup={displayPopup}
      title={title}
      onClosePress={onClosePress}>
      <View style={style.content}>
        <Text style={style.text}>{message}</Text>
      </View>
      {hasConfirmButton && (
        <IconButton
          testID={testID + '.confirmButton'}
          name="check"
          onPress={onConfirm}
        />
      )}
    </Popup>
  );
}

export function useMessagePopup() {
  const [messagePopup, setMessagePopup] = useState({
    isDisplayed: false,
    message: '',
    onConfirm: null,
    title: '',
  });

  const closeMessagePopup = useCallback(() => {
    setMessagePopup(prevValue => {
      return {...prevValue, isDisplayed: false};
    });
  }, []);

  const openMessagePopup = useCallback(
    (message, title, onConfirm) => {
      if (!title) {
        title = translate('warning');
      }
      let _handleConfirm = () => {
        onConfirm();
        closeMessagePopup();
      };

      setMessagePopup({
        isDisplayed: true,
        message: message,
        onConfirm: _handleConfirm,
        title: title,
      });
    },
    [closeMessagePopup],
  );

  return {
    openMessagePopup,
    closeMessagePopup,
    messagePopup,
  };
}

const style = StyleSheet.create({
  content: {paddingLeft: 10, paddingRight: 10},
  text: {...styles.lightText, fontSize: 30, padding: 20},
});
