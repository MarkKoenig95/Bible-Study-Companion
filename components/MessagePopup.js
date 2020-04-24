import React from 'react';
import {Text, StyleSheet, View} from 'react-native';
import Popup from './Popup';

import styles from '../styles/styles';

export default function MessagePopup(props) {
  return (
    <Popup
      displayPopup={props.displayPopup}
      title={props.title}
      onClosePress={props.onClosePress}>
      <Text style={style.text}>{props.message}</Text>
    </Popup>
  );
}

const style = StyleSheet.create({
  text: {...styles.text, fontSize: 30},
});
