import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import Popup from './Popup';
import IconButton from '../buttons/IconButton';

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

const style = StyleSheet.create({
  content: {paddingLeft: 10, paddingRight: 10},
  text: {...styles.lightText, fontSize: 30, padding: 20},
});
