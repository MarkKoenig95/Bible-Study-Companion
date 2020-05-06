import React from 'react';
import {Text, StyleSheet} from 'react-native';

import Popup from './Popup';
import IconButton from './IconButton';

import styles from '../styles/styles';

export default function MessagePopup(props) {
  const hasConfirmButton = props.onConfirm && true;

  return (
    <Popup
      displayPopup={props.displayPopup}
      title={props.title}
      onClosePress={props.onClosePress}>
      <Text style={style.text}>{props.message}</Text>
      {hasConfirmButton && (
        <IconButton name="check" onPress={props.onConfirm} />
      )}
    </Popup>
  );
}

const style = StyleSheet.create({
  text: {...styles.text, fontSize: 30, padding: 20},
});
