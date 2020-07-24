import React, {useState, useCallback} from 'react';
import {StyleSheet, View} from 'react-native';

import Popup from './Popup';
import IconButton from '../buttons/IconButton';
import Text from '../text/Text';

import {translate} from '../../localization/localization';

import styles from '../../styles/styles';

export default function MessagePopup(props) {
  const hasConfirmButton = props.onConfirm && true;

  return (
    <Popup
      displayPopup={props.displayPopup}
      title={props.title}
      onClosePress={props.onClosePress}>
      <View style={style.content}>
        <Text style={style.text}>{props.message}</Text>
      </View>
      {hasConfirmButton && (
        <IconButton name="check" onPress={props.onConfirm} />
      )}
    </Popup>
  );
}

export function useMessagePopup() {
  const [messagePopup, setMessagePopup] = useState({
    isDisplayed: false,
    message: '',
    title: '',
  });

  const closeMessagePopup = useCallback(() => {
    setMessagePopup(prevValue => {
      return {...prevValue, isDisplayed: false};
    });
  }, []);

  const openMessagePopupBase = useCallback((message, title) => {
    if (!title) {
      title = translate('warning');
    }
    setMessagePopup({isDisplayed: true, message: message, title: title});
  }, []);

  return {
    openMessagePopupBase: openMessagePopupBase,
    closeMessagePopup: closeMessagePopup,
    messagePopup: messagePopup,
  };
}

const style = StyleSheet.create({
  content: {paddingLeft: 10, paddingRight: 10},
  text: {...styles.lightText, fontSize: 30, padding: 20},
});
