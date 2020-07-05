import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';

import Popup from './Popup';
import IconButton from '../buttons/IconButton';
import Text from '../text/Text';

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

  function closeMessagePopup() {
    setMessagePopup(prevValue => {
      return {...prevValue, isDisplayed: false};
    });
  }

  function openMessagePopup(message, title) {
    setMessagePopup({isDisplayed: true, message: message, title: title});
  }

  return {
    openMessagePopup: openMessagePopup,
    closeMessagePopup: closeMessagePopup,
    messagePopup: messagePopup,
  };
}

const style = StyleSheet.create({
  content: {paddingLeft: 10, paddingRight: 10},
  text: {...styles.lightText, fontSize: 30, padding: 20},
});
