import React from 'react';
import {Text, StyleSheet} from 'react-native';
import Popup from './Popup';

import styles, {colors} from '../styles/styles';

export default function ErrorPopup(props) {
  return (
    <Popup
      displayPopup={props.displayPopup}
      title="Error"
      onClosePress={props.onClosePress}>
      <Text style={style.text}>{props.message}</Text>
    </Popup>
  );
}

const style = StyleSheet.create({
  text: {...styles.text, fontSize: 30},
});
