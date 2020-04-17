import 'react-native-gesture-handler';
import React from 'react';
import {Text, StyleSheet, View} from 'react-native';
import IconButton from './IconButton';

import styles, {colors} from '../styles/styles';

export default function Popup(props) {
  return (
    <View
      style={[styles.background, {display: !props.displayPopup ? 'none' : ''}]}>
      <View
        style={{
          ...styles.popup,
          ...props.style,
        }}>
        <View style={style.title}>
          <Text style={style.text}>{props.title}</Text>
          <IconButton
            name="close"
            invertColor={true}
            onPress={props.onClosePress}
          />
        </View>
        <View style={style.content}>{props.children}</View>
      </View>
    </View>
  );
}
const style = StyleSheet.create({
  closeButton: {
    backgroundColor: colors.lightBlue,
  },
  buttonText: {
    color: colors.darkGray,
    fontWeight: 'bold',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
    marginTop: 80,
    marginBottom: 30,
    width: '100%',
  },
  text: {
    ...styles.text,
    flex: 4,
    padding: 10,
    fontSize: 25,
    color: colors.darkGray,
  },
  title: {
    alignItems: 'center',
    backgroundColor: colors.smoke,
    flexDirection: 'row',
    height: 60,
    justifyContent: 'space-around',
    position: 'absolute',
    top: 0,
    width: '100%',
  },
});
