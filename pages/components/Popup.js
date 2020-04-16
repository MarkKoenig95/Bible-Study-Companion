import 'react-native-gesture-handler';
import React, {useState} from 'react';
import {Text, StyleSheet, View} from 'react-native';
import IconButton from './IconButton';

import styles, {colors} from '../styles/styles';

export default function Popup(props) {
  return (
    <View
      style={[style.background, {display: !props.displayPopup ? 'none' : ''}]}>
      <View
        style={{
          ...styles.popup,
          ...props.style,
        }}>
        <View style={style.title}>
          <Text style={style.text}>{props.title}</Text>
          <IconButton
            buttonStyle={style.closeButton}
            textStyle={style.buttonText}
            size={4}
            icon="x"
            onPress={props.onClosePress}
          />
        </View>
        {props.children}
      </View>
    </View>
  );
}
const style = StyleSheet.create({
  background: {
    height: '100%',
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  closeButton: {
    backgroundColor: colors.lightBlue,
  },
  buttonText: {
    color: colors.darkGray,
    fontWeight: 'bold',
  },
  text: {
    ...styles.text,
    flex: 6,
    padding: 10,
    fontSize: 25,
    color: colors.darkGray,
  },
  title: {
    backgroundColor: colors.smoke,
    position: 'absolute',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    top: 0,
    width: '100%',
  },
});
